-- Phase 3: chain hub status, email on participants, updated RPCs

-- Drop old signatures before recreating with email args
drop function if exists public.create_chain(text, text, jsonb, int);
drop function if exists public.submit_step(text, text, text, text, jsonb);

create or replace function public.create_chain(
  p_prompt_text text,
  p_nickname text,
  p_stroke_json jsonb,
  p_max_steps int default 6,
  p_email text default null
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
  v_email text;
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

  v_email := nullif(lower(trim(coalesce(p_email, ''))), '');
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

  insert into public.chain_participants (chain_id, nickname, email)
  values (v_chain_id, trim(p_nickname), v_email);

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

create or replace function public.submit_step(
  p_slug text,
  p_claim_token text,
  p_nickname text,
  p_guess_text text default null,
  p_stroke_json jsonb default null,
  p_email text default null
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
  v_email text;
begin
  if p_nickname is null or length(trim(p_nickname)) = 0 then
    raise exception 'nickname_required';
  end if;

  v_email := nullif(lower(trim(coalesce(p_email, ''))), '');

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

  insert into public.chain_participants (chain_id, nickname, email)
  values (v_chain.id, trim(p_nickname), v_email)
  on conflict (chain_id, nickname) do update
    set email = coalesce(excluded.email, public.chain_participants.email);

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

-- Safe public hub status (no drawings / guesses / prompt)
create or replace function public.get_chain_status(p_slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_chain public.chains%rowtype;
  v_step public.steps%rowtype;
begin
  select * into v_chain from public.chains where slug = p_slug;
  if not found then
    raise exception 'chain_not_found';
  end if;

  select * into v_step
  from public.steps
  where chain_id = v_chain.id and step_number = v_chain.current_step;

  -- Auto-flag overdue open seats for hub display
  if v_step.status = 'open' and v_step.due_at is not null and v_step.due_at < now() then
    update public.steps set status = 'expired' where id = v_step.id;
    update public.chains set status = 'open_seat', updated_at = now() where id = v_chain.id;
    v_chain.status := 'open_seat';
    v_step.status := 'expired';
  end if;

  return jsonb_build_object(
    'slug', v_chain.slug,
    'status', v_chain.status,
    'max_steps', v_chain.max_steps,
    'current_step', v_chain.current_step,
    'last_completer_nickname', v_chain.last_completer_nickname,
    'step_status', v_step.status,
    'step_type', v_step.type,
    'due_at', v_step.due_at
  );
end;
$$;

grant execute on function public.create_chain(text, text, jsonb, int, text) to anon, authenticated;
grant execute on function public.submit_step(text, text, text, text, jsonb, text) to anon, authenticated;
grant execute on function public.get_chain_status(text) to anon, authenticated;
