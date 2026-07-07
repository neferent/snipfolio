alter table public.profiles
  add column if not exists capture_count int not null default 0,
  add column if not exists pro_capture_count int not null default 0,
  add column if not exists pro_capture_period_start timestamptz;

comment on column public.profiles.capture_count is
  'Lifetime URL-capture count for free-tier users, checked against a fixed limit. Resettable by an admin.';
comment on column public.profiles.pro_capture_count is
  'URL-capture count within the current rolling monthly window, for Pro/day-pass users.';
comment on column public.profiles.pro_capture_period_start is
  'Start of the current pro_capture_count window; rolled forward automatically once 30 days elapse.';
