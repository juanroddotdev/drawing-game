-- Dev/solo inspector: full chain dump + mint play link.
-- Gated by p_key matching expected secret (set in app env).
-- Not for production exposure without rotating/removing.

create or replace function public.assert_dev_inspector_key(p_key text)
returns void
language plpgsql
immutable
as $$
begin
  -- Default local key; override later via a tighter check if needed.
  if p_key is null or p_key is distinct from 'penpass-local-dev' then
    raise exception 'dev_inspector_forbidden';
  end if;
end;
$$;

create or replace function public.get_chain_inspector(
  p_slug text,
  p_key text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_chain public.chains%rowtype;
  v_step public.steps%rowtype;
begin
  perform public.assert_dev_inspector_key(p_key);

  select * into v_chain from public.chains where slug = p_slug;
  if not found then
    raise exception 'chain_not_found';
  end if;

  select * into v_step
  from public.steps
  where chain_id = v_chain.id and step_number = v_chain.current_step;

  if v_step.status = 'open' and v_step.due_at is not null and v_step.due_at < now() then
    update public.steps set status = 'expired' where id = v_step.id;
    update public.chains set status = 'open_seat', updated_at = now() where id = v_chain.id;
    v_chain.status := 'open_seat';
    v_step.status := 'expired';
  end if;

  return jsonb_build_object(
    'slug', v_chain.slug,
    'status', v_chain.status,
    'prompt_text', v_chain.prompt_text,
    'creator_nickname', v_chain.creator_nickname,
    'max_steps', v_chain.max_steps,
    'current_step', v_chain.current_step,
    'last_completer_nickname', v_chain.last_completer_nickname,
    'current_step_status', v_step.status,
    'current_step_type', v_step.type,
    'due_at', v_step.due_at,
    'steps', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'step_number', s.step_number,
          'type', s.type,
          'status', s.status,
          'author_nickname', s.author_nickname,
          'guess_text', s.guess_text,
          'stroke_json', s.stroke_json,
          'submitted_at', s.submitted_at,
          'due_at', s.due_at
        )
        order by s.step_number
      )
      from public.steps s
      where s.chain_id = v_chain.id
    ), '[]'::jsonb)
  );
end;
$$;

-- Mint/refresh a play token for the current open or expired seat (solo testing).
create or replace function public.dev_mint_play_link(
  p_slug text,
  p_key text
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
  perform public.assert_dev_inspector_key(p_key);

  select * into v_chain from public.chains where slug = p_slug for update;
  if not found then
    raise exception 'chain_not_found';
  end if;

  if v_chain.status = 'complete' then
    raise exception 'chain_complete';
  end if;

  select * into v_step
  from public.steps
  where chain_id = v_chain.id and step_number = v_chain.current_step
  for update;

  if not found then
    raise exception 'step_not_found';
  end if;

  if v_step.status = 'submitted' then
    raise exception 'no_open_seat';
  end if;

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
    'next_step', v_step.step_number,
    'step_type', v_step.type,
    'claim_token', v_token
  );
end;
$$;

grant execute on function public.get_chain_inspector(text, text) to anon, authenticated;
grant execute on function public.dev_mint_play_link(text, text) to anon, authenticated;
