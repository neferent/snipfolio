-- source_images table (replaces the unused project_snapshots)
create table if not exists public.source_images (
  id          text primary key,
  project_id  uuid references public.projects(id) on delete cascade not null,
  label       text not null default 'Screenshot',
  filename    text not null default 'screenshot',
  width       int not null default 0,
  height      int not null default 0,
  sort_order  int not null default 0
);

alter table public.source_images enable row level security;

create policy "Users can manage their own source images"
  on public.source_images
  for all
  using (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid())
  );

-- Add source_image_id and snap_frame to snips
alter table public.snips
  add column if not exists source_image_id text not null default 'default',
  add column if not exists snap_frame text check (snap_frame in ('laptop', 'phone')) default null;

-- Widen compositions type check to include new types
alter table public.compositions
  drop constraint if exists compositions_type_check;

alter table public.compositions
  add constraint compositions_type_check
  check (type in ('single', 'collage', 'laptop', 'phone', 'auto', 'freeform'));

-- Storage policies for the existing screenshots bucket
-- (bucket was created in 001, only add policies if they don't exist)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'Users can update their screenshots'
  ) then
    execute $policy$
      create policy "Users can update their screenshots"
        on storage.objects for update
        using (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1])
        with check (bucket_id = 'screenshots' and auth.uid()::text = (storage.foldername(name))[1])
    $policy$;
  end if;
end $$;
