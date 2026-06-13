-- Allow the 'laptop+tablet+phone', 'browser', and 'browser+url' composition
-- types (used by Compose-from-URL's new output presets)
alter table public.compositions
  drop constraint if exists compositions_type_check;

alter table public.compositions
  add constraint compositions_type_check
  check (type in ('single', 'collage', 'laptop', 'phone', 'auto', 'freeform', 'laptop+phone', 'laptop+tablet+phone', 'browser', 'browser+url'));
