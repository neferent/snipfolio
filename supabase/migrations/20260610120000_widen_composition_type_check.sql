-- Allow the 'laptop+phone' composition type (used by Compose-from-URL when both
-- a desktop and mobile screenshot are captured)
alter table public.compositions
  drop constraint if exists compositions_type_check;

alter table public.compositions
  add constraint compositions_type_check
  check (type in ('single', 'collage', 'laptop', 'phone', 'auto', 'freeform', 'laptop+phone'));
