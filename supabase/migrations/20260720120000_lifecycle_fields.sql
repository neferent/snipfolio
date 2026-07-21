alter table public.profiles
  add column if not exists has_ever_paid boolean not null default false,
  add column if not exists last_active_at timestamptz not null default now();

comment on column public.profiles.has_ever_paid is
  'True once a subscription or day-pass has ever been purchased. Never reset on cancel/expiry — permanently exempts the account from the free-tier inactivity storage purge.';
comment on column public.profiles.last_active_at is
  'Updated on session load (see server/api/me/profile.get.ts). Used by the free-tier inactivity purge cron.';

update public.profiles
  set has_ever_paid = true
  where is_pro = true or pro_expires_at is not null;
