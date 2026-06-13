alter table public.snips
  add column if not exists is_full_source boolean not null default false;
