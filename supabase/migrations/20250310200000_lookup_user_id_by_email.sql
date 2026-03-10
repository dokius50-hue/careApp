-- Look up auth user id by email. Used when adding org members (replaces Edge Function).
-- Only callable by authenticated users. Returns NULL if email not found.

create or replace function public.lookup_user_id_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
begin
  if auth.uid() is null then
    return null;
  end if;
  if p_email is null or trim(p_email) = '' then
    return null;
  end if;

  select id into v_user_id
  from auth.users
  where lower(trim(email)) = lower(trim(p_email))
  limit 1;

  return v_user_id;
end;
$$;

grant execute on function public.lookup_user_id_by_email(text) to authenticated;
grant execute on function public.lookup_user_id_by_email(text) to service_role;
