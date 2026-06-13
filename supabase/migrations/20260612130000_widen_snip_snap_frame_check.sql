-- Allow the 'tablet' snap_frame value (used by Compose-from-URL's
-- 'Laptop + Tablet + Phone' preset)
alter table public.snips
  drop constraint if exists snips_snap_frame_check;

alter table public.snips
  add constraint snips_snap_frame_check
  check (snap_frame in ('laptop', 'phone', 'tablet'));
