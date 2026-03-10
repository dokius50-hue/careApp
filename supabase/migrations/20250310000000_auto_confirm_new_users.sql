-- Auto-confirm new users so they can sign in immediately while still receiving the confirmation email.
-- Trigger runs BEFORE INSERT on auth.users and sets email_confirmed_at so the user is treated as confirmed.

create or replace function public.auto_confirm_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

-- Only create trigger if it does not exist (idempotent for re-runs)
drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute procedure public.auto_confirm_new_user();
