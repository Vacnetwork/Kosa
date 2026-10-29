-- Events, finance, welfare and mentorship RPCs.

create or replace function public.register_for_event(
  p_event_id uuid,
  p_guests int,
  p_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_event public.events;
  v_guests int := coalesce(p_guests, 0);
  v_taken int;
  v_status text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Sign in to register for an event' using errcode = '42501';
  end if;
  if not private.is_active_member(v_uid) then
    raise exception 'Only active members can register for events' using errcode = '42501';
  end if;
  if v_guests not between 0 and 10 then
    raise exception 'You can bring between 0 and 10 guests' using errcode = '22023';
  end if;
  if p_notes is not null and char_length(p_notes) > 500 then
    raise exception 'Keep the note under 500 characters' using errcode = '22023';
  end if;

  select * into v_event
  from public.events
  where id = p_event_id and is_published;

  if not found then
    raise exception 'Event not found' using errcode = 'P0002';
  end if;
  if v_event.ends_at is not null and v_event.ends_at < now() then
    raise exception 'This event has already ended' using errcode = '22023';
  end if;

  -- Places already taken by other people (their own previous row excluded).
  select coalesce(sum(r.guests + 1), 0) into v_taken
  from public.event_registrations r
  where r.event_id = p_event_id
    and r.status in ('going', 'waitlist')
    and r.user_id <> v_uid;

  if v_event.capacity is null or v_taken + v_guests + 1 <= v_event.capacity then
    v_status := 'going';
  else
    v_status := 'waitlist';
  end if;

  insert into public.event_registrations (event_id, user_id, status, guests, notes)
  values (p_event_id, v_uid, v_status, v_guests, nullif(btrim(coalesce(p_notes, '')), ''))
  on conflict (event_id, user_id) do update
    set status = excluded.status,
        guests = excluded.guests,
        notes = excluded.notes,
        updated_at = now()
  returning id into v_id;

  perform private.write_audit(
    v_uid,
    'event.registration.' || v_status,
    'event_registrations',
    v_id::text,
    jsonb_build_object('event_id', p_event_id, 'guests', v_guests)
  );

  return v_id;
end;
$$;

create or replace function public.record_contribution(
  p_member_id uuid,
  p_campaign text,
  p_amount numeric,
  p_currency text,
  p_method text,
  p_reference text,
  p_received_at date,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_id uuid;
begin
  if v_uid is null or not private.is_treasurer(v_uid) then
    raise exception 'Only the treasurer can record contributions' using errcode = '42501';
  end if;
  if p_campaign is null or char_length(btrim(p_campaign)) not between 2 and 120 then
    raise exception 'Name the campaign or fund' using errcode = '22023';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount > 100000000 then
    raise exception 'Enter an amount greater than zero' using errcode = '22023';
  end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then
    raise exception 'Use a 3-letter currency code' using errcode = '22023';
  end if;
  if p_method is not null and char_length(p_method) > 60 then
    raise exception 'Keep the method under 60 characters' using errcode = '22023';
  end if;
  if p_reference is not null and char_length(p_reference) > 80 then
    raise exception 'Keep the reference under 80 characters' using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 300 then
    raise exception 'Keep the note under 300 characters' using errcode = '22023';
  end if;
  if p_member_id is not null and not exists (select 1 from public.profiles p where p.id = p_member_id) then
    raise exception 'Member not found' using errcode = 'P0002';
  end if;

  insert into public.contributions (
    member_id, campaign, amount, currency, method, reference, received_at, recorded_by, note
  )
  values (
    p_member_id,
    btrim(p_campaign),
    p_amount,
    p_currency,
    nullif(btrim(coalesce(p_method, '')), ''),
    nullif(btrim(coalesce(p_reference, '')), ''),
    coalesce(p_received_at, current_date),
    v_uid,
    nullif(btrim(coalesce(p_note, '')), '')
  )
  returning id into v_id;

  perform private.write_audit(
    v_uid,
    'contribution.recorded',
    'contributions',
    v_id::text,
    jsonb_build_object('amount', p_amount, 'currency', p_currency, 'campaign', p_campaign)
  );

  return v_id;
end;
$$;

create or replace function public.decide_welfare_request(
  p_request_id uuid,
  p_status text,
  p_note text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null or not private.is_executive(v_uid) then
    raise exception 'Only the executive committee can decide welfare requests' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('reviewing', 'approved', 'disbursed', 'declined') then
    raise exception 'Unknown welfare decision' using errcode = '22023';
  end if;
  if p_note is not null and char_length(p_note) > 2000 then
    raise exception 'Keep the note under 2000 characters' using errcode = '22023';
  end if;

  update public.welfare_requests
  set status = p_status,
      handled_by = v_uid,
      decision_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_request_id;

  if not found then
    raise exception 'Welfare request not found' using errcode = 'P0002';
  end if;

  perform private.write_audit(
    v_uid,
    'welfare.request.' || p_status,
    'welfare_requests',
    p_request_id::text,
    null
  );
end;
$$;

create or replace function public.request_mentorship(
  p_mentor_id uuid,
  p_message text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_offer public.mentorship_offers;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Sign in to request mentorship' using errcode = '42501';
  end if;
  if not private.is_active_member(v_uid) then
    raise exception 'Only active members can request mentorship' using errcode = '42501';
  end if;
  if p_mentor_id is null then
    raise exception 'Choose a mentor' using errcode = '22023';
  end if;
  if p_mentor_id = v_uid then
    raise exception 'You cannot request mentorship from yourself' using errcode = '22023';
  end if;
  if p_message is null or char_length(btrim(p_message)) not between 20 and 2000 then
    raise exception 'Write a short message (20 to 2000 characters)' using errcode = '22023';
  end if;

  select * into v_offer
  from public.mentorship_offers o
  where o.user_id = p_mentor_id;

  if not found or not v_offer.is_accepting or not private.is_active_member(p_mentor_id) then
    raise exception 'This mentor is not accepting requests' using errcode = 'P0002';
  end if;

  perform public.assert_rate_limit('mentorship:' || v_uid::text, 3, 86400);

  if exists (
    select 1 from public.mentorship_requests r
    where r.mentor_id = p_mentor_id and r.mentee_id = v_uid and r.status = 'pending'
  ) then
    raise exception 'You already have a pending request with this mentor';
  end if;

  insert into public.mentorship_requests (mentor_id, mentee_id, message)
  values (p_mentor_id, v_uid, btrim(p_message))
  returning id into v_id;

  perform private.write_audit(
    v_uid,
    'mentorship.requested',
    'mentorship_requests',
    v_id::text,
    jsonb_build_object('mentor_id', p_mentor_id)
  );

  return v_id;
end;
$$;

create or replace function public.respond_mentorship(
  p_request_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_req public.mentorship_requests;
begin
  if v_uid is null then
    raise exception 'Sign in to respond to a mentorship request' using errcode = '42501';
  end if;
  if p_status is null or p_status not in ('accepted', 'declined', 'closed') then
    raise exception 'Unknown mentorship decision' using errcode = '22023';
  end if;

  select * into v_req
  from public.mentorship_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Mentorship request not found' using errcode = 'P0002';
  end if;

  if v_uid = v_req.mentor_id then
    null;
  elsif v_uid = v_req.mentee_id and p_status = 'closed' then
    null;
  else
    raise exception 'Only the mentor can respond to this request' using errcode = '42501';
  end if;

  update public.mentorship_requests
  set status = p_status
  where id = v_req.id;

  perform private.write_audit(
    v_uid,
    'mentorship.' || p_status,
    'mentorship_requests',
    v_req.id::text,
    null
  );
end;
$$;

revoke all on function public.register_for_event(uuid, int, text) from public, anon;
revoke all on function public.record_contribution(uuid, text, numeric, text, text, text, date, text) from public, anon;
revoke all on function public.decide_welfare_request(uuid, text, text) from public, anon;
revoke all on function public.request_mentorship(uuid, text) from public, anon;
revoke all on function public.respond_mentorship(uuid, text) from public, anon;

grant execute on function public.register_for_event(uuid, int, text) to authenticated;
grant execute on function public.record_contribution(uuid, text, numeric, text, text, text, date, text) to authenticated;
grant execute on function public.decide_welfare_request(uuid, text, text) to authenticated;
grant execute on function public.request_mentorship(uuid, text) to authenticated;
grant execute on function public.respond_mentorship(uuid, text) to authenticated;
