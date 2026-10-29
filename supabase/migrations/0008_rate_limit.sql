-- Rate limiting shared by the unauthenticated/untrusted write paths.
--
-- assert_rate_limit() records one hit for a key and raises when the key has
-- already used its budget inside the window. It is SECURITY DEFINER because
-- rate_limit_events has no RLS policy at all: no client can read, write or
-- forge the ledger, and no client can call this function directly.

create or replace function public.assert_rate_limit(
  p_key text,
  p_max_hits int,
  p_window_seconds int
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hits int;
begin
  if p_key is null or char_length(btrim(p_key)) = 0 then
    raise exception 'rate limit key is required' using errcode = '22023';
  end if;
  if p_max_hits is null or p_max_hits < 1 then
    raise exception 'rate limit budget must be at least 1' using errcode = '22023';
  end if;
  if p_window_seconds is null or p_window_seconds < 1 then
    raise exception 'rate limit window must be at least 1 second' using errcode = '22023';
  end if;

  -- Serialise concurrent hits for the same key for the rest of the transaction.
  perform pg_advisory_xact_lock(hashtextextended(p_key, 42));

  delete from public.rate_limit_events e
  where e.key = p_key
    and e.created_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into v_hits
  from public.rate_limit_events e
  where e.key = p_key
    and e.created_at >= now() - make_interval(secs => p_window_seconds);

  if v_hits >= p_max_hits then
    raise exception 'rate limit exceeded: too many attempts, try again later'
      using errcode = '53400';
  end if;

  insert into public.rate_limit_events (key) values (btrim(p_key));
end;
$$;

revoke all on function public.assert_rate_limit(text, int, int) from public;
revoke all on function public.assert_rate_limit(text, int, int) from anon, authenticated;
grant execute on function public.assert_rate_limit(text, int, int) to service_role;
