-- Day pass now grants temporary account-wide Pro access instead of
-- per-project export access.
alter table public.profiles add column if not exists pro_expires_at timestamptz;

drop table if exists public.project_export_access;
