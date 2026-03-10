-- RPC: return org members with email and joined_at for the current user's org.
-- Only callable by users who are members of the given org.
-- Reads auth.users for email (not exposed to client otherwise).

create or replace function public.get_org_members_with_details(p_org_id uuid)
returns table (
  user_id uuid,
  email text,
  joined_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Only allow if caller is a member of this org
  if not exists (
    select 1 from public.org_members om
    where om.org_id = p_org_id and om.user_id = auth.uid()
  ) then
    return;
  end if;

  return query
  select m.user_id, u.email::text, m.joined_at
  from public.org_members m
  join auth.users u on u.id = m.user_id
  where m.org_id = p_org_id
  order by m.joined_at asc;
end;
$$;

grant execute on function public.get_org_members_with_details(uuid) to authenticated;
grant execute on function public.get_org_members_with_details(uuid) to service_role;
