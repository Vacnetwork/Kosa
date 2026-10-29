-- Public contact form. Anonymous visitors have no table access at all; this
-- is the only write they can perform, and it is rate limited per address.

create or replace function public.submit_contact_message(
  p_name text,
  p_email text,
  p_subject text,
  p_message text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_id uuid;
begin
  if p_name is null or char_length(btrim(p_name)) not between 2 and 120 then
    raise exception 'Enter your name' using errcode = '22023';
  end if;
  if v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid email address' using errcode = '22023';
  end if;
  if p_subject is null or char_length(btrim(p_subject)) not between 3 and 160 then
    raise exception 'Add a subject' using errcode = '22023';
  end if;
  if p_message is null or char_length(btrim(p_message)) not between 20 and 2000 then
    raise exception 'Write your message (20 to 2000 characters)' using errcode = '22023';
  end if;

  perform public.assert_rate_limit('contact_message:' || v_email, 5, 3600);

  insert into public.contact_messages (name, email, subject, message)
  values (btrim(p_name), v_email, btrim(p_subject), btrim(p_message))
  returning id into v_id;

  perform private.write_audit(null, 'contact.message.received', 'contact_messages', v_id::text, null);
end;
$$;

revoke all on function public.submit_contact_message(text, text, text, text) from public;
grant execute on function public.submit_contact_message(text, text, text, text) to anon, authenticated, service_role;
