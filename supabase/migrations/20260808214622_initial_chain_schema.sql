-- PenPass Phase 2: chain schema + SECURITY DEFINER RPCs
-- Client talks via RPCs only; tables locked down with RLS.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.chain_status as enum (
  'active',
  'awaiting_pass',
  'open_seat',
  'complete',
  'abandoned'
);

create type public.step_type as enum ('draw', 'guess');

create type public.step_status as enum (
  'open',
  'claimed',
  'submitted',
  'expired'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text,
  email text,
  created_at timestamptz not null default now()
);

create table public.chains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  creator_id uuid references public.profiles (id) on delete set null,
  creator_nickname text not null,
  prompt_text text not null,
  max_steps int not null default 6 check (max_steps >= 2 and max_steps <= 12),
  status public.chain_status not null default 'awaiting_pass',
  current_step int not null default 1,
  last_completer_nickname text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.steps (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.chains (id) on delete cascade,
  step_number int not null check (step_number >= 1),
  type public.step_type not null,
  status public.step_status not null default 'open',
  author_id uuid references public.profiles (id) on delete set null,
  author_nickname text,
  guess_text text,
  stroke_json jsonb,
  claim_token_hash text,
  claimed_at timestamptz,
  due_at timestamptz,
  submitted_at timestamptz,
  unique (chain_id, step_number)
);

create index steps_chain_id_idx on public.steps (chain_id);
create index steps_claim_token_hash_idx on public.steps (claim_token_hash)
  where claim_token_hash is not null;

create table public.chain_participants (
  id uuid primary key default gen_random_uuid(),
  chain_id uuid not null references public.chains (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  nickname text not null,
  email text,
  created_at timestamptz not null default now(),
  unique (chain_id, nickname)
);

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger chains_set_updated_at
before update on public.chains
for each row execute function public.set_updated_at();

create or replace function public.generate_slug()
returns text
language sql
volatile
as $$
  select substr(encode(extensions.gen_random_bytes(6), 'hex'), 1, 10);
$$;

create or replace function public.hash_token(raw_token text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(raw_token, 'sha256'), 'hex');
$$;

create or replace function public.new_claim_token()
returns text
language sql
volatile
as $$
  select encode(extensions.gen_random_bytes(18), 'hex');
$$;

create or replace function public.step_type_for_number(step_number int)
returns public.step_type
language sql
immutable
as $$
  select case when step_number % 2 = 1 then 'draw'::public.step_type else 'guess'::public.step_type end;
$$;

create or replace function public.default_timeout_interval()
returns interval
language sql
immutable
as $$
  select interval '24 hours';
$$;

-- ---------------------------------------------------------------------------
-- RLS: deny direct table access from clients; use RPCs
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.chains enable row level security;
alter table public.steps enable row level security;
alter table public.chain_participants enable row level security;

-- No policies for anon/authenticated on tables → blocked by default.
-- Service role bypasses RLS for dashboard/admin.

-- ---------------------------------------------------------------------------
-- RPC: create_chain
-- Creates chain + submitted step 1 (draw) + open step 2 with invite token.
-- ---------------------------------------------------------------------------
create or replace function public.create_chain(
  p_prompt_text text,
  p_nickname text,
  p_stroke_json jsonb,
  p_max_steps int default 6
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slug text;
  v_chain_id uuid;
  v_token text;
  v_max int;
begin
  if p_prompt_text is null or length(trim(p_prompt_text)) = 0 then
    raise exception 'prompt_required';
  end if;
  if p_nickname is null or length(trim(p_nickname)) = 0 then
    raise exception 'nickname_required';
  end if;
  if p_stroke_json is null then
    raise exception 'stroke_required';
  end if;

  v_max := coalesce(p_max_steps, 6);
  if v_max < 2 or v_max > 12 then
    raise exception 'invalid_max_steps';
  end if;

  loop
    v_slug := public.generate_slug();
    exit when not exists (select 1 from public.chains c where c.slug = v_slug);
  end loop;

  insert into public.chains (
    slug, creator_nickname, prompt_text, max_steps, status, current_step, last_completer_nickname
  ) values (
    v_slug, trim(p_nickname), trim(p_prompt_text), v_max, 'awaiting_pass', 1, trim(p_nickname)
  )
  returning id into v_chain_id;

  insert into public.steps (
    chain_id, step_number, type, status, author_nickname, stroke_json, submitted_at
  ) values (
    v_chain_id, 1, 'draw', 'submitted', trim(p_nickname), p_stroke_json, now()
  );

  insert into public.chain_participants (chain_id, nickname)
  values (v_chain_id, trim(p_nickname));

  v_token := public.new_claim_token();

  insert into public.steps (
    chain_id, step_number, type, status, claim_token_hash, due_at
  ) values (
    v_chain_id,
    2,
    public.step_type_for_number(2),
    'open',
    public.hash_token(v_token),
    now() + public.default_timeout_interval()
  );

  update public.chains
  set current_step = 2, status = 'awaiting_pass', updated_at = now()
  where id = v_chain_id;

  return jsonb_build_object(
    'slug', v_slug,
    'chain_id', v_chain_id,
    'max_steps', v_max,
    'next_step', 2,
    'claim_token', v_token,
    'status', 'awaiting_pass'
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_play_payload — visibility-safe payload for an invite token
-- ---------------------------------------------------------------------------
create or replace function public.get_play_payload(
  p_slug text,
  p_claim_token text
)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_chain public.chains%rowtype;
  v_step public.steps%rowtype;
  v_prev public.steps%rowtype;
  v_hash text;
begin
  select * into v_chain from public.chains where slug = p_slug;
  if not found then
    raise exception 'chain_not_found';
  end if;

  if v_chain.status = 'complete' then
    return jsonb_build_object(
      'status', 'complete',
      'slug', v_chain.slug,
      'max_steps', v_chain.max_steps
    );
  end if;

  v_hash := public.hash_token(p_claim_token);

  select * into v_step
  from public.steps
  where chain_id = v_chain.id
    and claim_token_hash = v_hash
    and status in ('open', 'claimed');

  if not found then
    -- Maybe timed out: mark open_seat if due
    update public.steps s
    set status = 'expired'
    from public.chains c
    where c.id = s.chain_id
      and c.slug = p_slug
      and s.status = 'open'
      and s.due_at is not null
      and s.due_at < now();

    update public.chains
    set status = 'open_seat', updated_at = now()
    where slug = p_slug
      and status in ('active', 'awaiting_pass')
      and exists (
        select 1 from public.steps s
        where s.chain_id = chains.id and s.status = 'expired' and s.step_number = chains.current_step
      );

    raise exception 'invalid_or_expired_token';
  end if;

  if v_step.due_at is not null and v_step.due_at < now() and v_step.status = 'open' then
    update public.steps set status = 'expired' where id = v_step.id;
    update public.chains set status = 'open_seat', updated_at = now() where id = v_chain.id;
    raise exception 'invalid_or_expired_token';
  end if;

  if v_step.step_number > 1 then
    select * into v_prev
    from public.steps
    where chain_id = v_chain.id and step_number = v_step.step_number - 1;
  end if;

  return jsonb_build_object(
    'status', v_chain.status,
    'slug', v_chain.slug,
    'max_steps', v_chain.max_steps,
    'step_number', v_step.step_number,
    'step_type', v_step.type,
    'due_at', v_step.due_at,
    -- Visibility: draw sees prior guess (or prompt for step 1 — not used here);
    -- guess sees prior drawing only. Never send prompt except via reveal.
    'prior_guess_text', case
      when v_step.type = 'draw' and v_step.step_number = 1 then v_chain.prompt_text
      when v_step.type = 'draw' then v_prev.guess_text
      else null
    end,
    'prior_stroke_json', case
      when v_step.type = 'guess' then v_prev.stroke_json
      else null
    end
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: submit_step — claim (if needed) + submit draw or guess, open next seat
-- ---------------------------------------------------------------------------
create or replace function public.submit_step(
  p_slug text,
  p_claim_token text,
  p_nickname text,
  p_guess_text text default null,
  p_stroke_json jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chain public.chains%rowtype;
  v_step public.steps%rowtype;
  v_hash text;
  v_next int;
  v_token text;
begin
  if p_nickname is null or length(trim(p_nickname)) = 0 then
    raise exception 'nickname_required';
  end if;

  select * into v_chain from public.chains where slug = p_slug for update;
  if not found then
    raise exception 'chain_not_found';
  end if;

  if v_chain.status = 'complete' then
    raise exception 'chain_complete';
  end if;

  v_hash := public.hash_token(p_claim_token);

  select * into v_step
  from public.steps
  where chain_id = v_chain.id
    and claim_token_hash = v_hash
    and status in ('open', 'claimed')
  for update;

  if not found then
    raise exception 'invalid_or_expired_token';
  end if;

  if v_step.due_at is not null and v_step.due_at < now() and v_step.status = 'open' then
    update public.steps set status = 'expired' where id = v_step.id;
    update public.chains set status = 'open_seat', updated_at = now() where id = v_chain.id;
    raise exception 'invalid_or_expired_token';
  end if;

  if v_step.type = 'guess' then
    if p_guess_text is null or length(trim(p_guess_text)) = 0 then
      raise exception 'guess_required';
    end if;
  else
    if p_stroke_json is null then
      raise exception 'stroke_required';
    end if;
  end if;

  update public.steps
  set
    status = 'submitted',
    author_nickname = trim(p_nickname),
    guess_text = case when v_step.type = 'guess' then trim(p_guess_text) else null end,
    stroke_json = case when v_step.type = 'draw' then p_stroke_json else null end,
    claimed_at = coalesce(claimed_at, now()),
    submitted_at = now(),
    claim_token_hash = null
  where id = v_step.id;

  insert into public.chain_participants (chain_id, nickname)
  values (v_chain.id, trim(p_nickname))
  on conflict (chain_id, nickname) do nothing;

  v_next := v_step.step_number + 1;

  if v_next > v_chain.max_steps then
    update public.chains
    set
      status = 'complete',
      current_step = v_step.step_number,
      last_completer_nickname = trim(p_nickname),
      updated_at = now()
    where id = v_chain.id;

    return jsonb_build_object(
      'slug', v_chain.slug,
      'status', 'complete',
      'completed_step', v_step.step_number,
      'claim_token', null,
      'next_step', null
    );
  end if;

  v_token := public.new_claim_token();

  insert into public.steps (
    chain_id, step_number, type, status, claim_token_hash, due_at
  ) values (
    v_chain.id,
    v_next,
    public.step_type_for_number(v_next),
    'open',
    public.hash_token(v_token),
    now() + public.default_timeout_interval()
  );

  update public.chains
  set
    status = 'awaiting_pass',
    current_step = v_next,
    last_completer_nickname = trim(p_nickname),
    updated_at = now()
  where id = v_chain.id;

  return jsonb_build_object(
    'slug', v_chain.slug,
    'status', 'awaiting_pass',
    'completed_step', v_step.step_number,
    'next_step', v_next,
    'claim_token', v_token
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: reopen_seat — last completer issues a fresh invite after timeout
-- ---------------------------------------------------------------------------
create or replace function public.reopen_seat(
  p_slug text,
  p_requester_nickname text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chain public.chains%rowtype;
  v_step public.steps%rowtype;
  v_token text;
begin
  select * into v_chain from public.chains where slug = p_slug for update;
  if not found then
    raise exception 'chain_not_found';
  end if;

  if v_chain.last_completer_nickname is distinct from trim(p_requester_nickname) then
    raise exception 'not_last_completer';
  end if;

  -- Expire any overdue open step
  update public.steps
  set status = 'expired'
  where chain_id = v_chain.id
    and step_number = v_chain.current_step
    and status = 'open'
    and due_at is not null
    and due_at < now();

  select * into v_step
  from public.steps
  where chain_id = v_chain.id and step_number = v_chain.current_step;

  if not found then
    raise exception 'step_not_found';
  end if;

  if v_step.status not in ('expired', 'open') then
    raise exception 'seat_not_reopenable';
  end if;

  -- If still open but not expired, just return existing is impossible (hash only).
  -- Always rotate token on reopen.
  v_token := public.new_claim_token();

  update public.steps
  set
    status = 'open',
    claim_token_hash = public.hash_token(v_token),
    due_at = now() + public.default_timeout_interval(),
    claimed_at = null
  where id = v_step.id;

  update public.chains
  set status = 'awaiting_pass', updated_at = now()
  where id = v_chain.id;

  return jsonb_build_object(
    'slug', v_chain.slug,
    'status', 'awaiting_pass',
    'next_step', v_step.step_number,
    'claim_token', v_token
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: get_reveal — full history only when complete
-- ---------------------------------------------------------------------------
create or replace function public.get_reveal(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_chain public.chains%rowtype;
begin
  select * into v_chain from public.chains where slug = p_slug;
  if not found then
    raise exception 'chain_not_found';
  end if;

  if v_chain.status is distinct from 'complete' then
    raise exception 'chain_not_complete';
  end if;

  return jsonb_build_object(
    'slug', v_chain.slug,
    'prompt_text', v_chain.prompt_text,
    'max_steps', v_chain.max_steps,
    'status', v_chain.status,
    'creator_nickname', v_chain.creator_nickname,
    'steps', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'step_number', s.step_number,
          'type', s.type,
          'author_nickname', s.author_nickname,
          'guess_text', s.guess_text,
          'stroke_json', s.stroke_json,
          'submitted_at', s.submitted_at
        )
        order by s.step_number
      )
      from public.steps s
      where s.chain_id = v_chain.id and s.status = 'submitted'
    ), '[]'::jsonb)
  );
end;
$$;

-- Grants
grant usage on schema public to anon, authenticated;
grant execute on function public.create_chain(text, text, jsonb, int) to anon, authenticated;
grant execute on function public.get_play_payload(text, text) to anon, authenticated;
grant execute on function public.submit_step(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.reopen_seat(text, text) to anon, authenticated;
grant execute on function public.get_reveal(text) to anon, authenticated;
