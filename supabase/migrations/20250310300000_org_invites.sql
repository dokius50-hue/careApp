-- Pending org invites: when a non-user is invited, we record (org_id, email).
-- When they accept the invite and sign up, a trigger adds them to org_members.

create table if not exists public.org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(org_id, email)
);

-- When a new user is created (e.g. after accepting an invite), add them to any orgs they were invited to.
create or replace function public.on_auth_user_created_add_org_invites()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.org_members (org_id, user_id)
  select i.org_id, new.id
  from public.org_invites i
  where lower(trim(i.email)) = lower(trim(new.email));

  delete from public.org_invites where lower(trim(email)) = lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_org_invites on auth.users;
create trigger on_auth_user_created_org_invites
  after insert on auth.users
  for each row execute procedure public.on_auth_user_created_add_org_invites();

-- Only the Edge Function (service_role) inserts into org_invites.
-- RLS enabled; no policy for authenticated so client cannot read/write; service_role bypasses RLS.
alter table public.org_invites enable row level security;

comment on table public.org_invites is 'Pending invites: when invitee signs up they are added to org_members by trigger';
