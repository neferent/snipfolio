-- Backfill profile rows for users who existed before migration 003
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;
