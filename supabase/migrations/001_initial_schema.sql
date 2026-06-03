-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Projects table
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null default 'Untitled',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "Users can manage their own projects"
  on public.projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Project snapshots (source screenshot metadata)
create table if not exists public.project_snapshots (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade not null,
  filename     text not null,
  width        int not null,
  height       int not null,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

alter table public.project_snapshots enable row level security;

create policy "Users can manage their own snapshots"
  on public.project_snapshots
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- Snips table
create table if not exists public.snips (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade not null,
  label        text not null default 'Snip',
  x            int not null default 0,
  y            int not null default 0,
  width        int not null default 100,
  height       int not null default 100,
  device_frame text not null default 'none' check (device_frame in ('none', 'phone', 'browser', 'laptop')),
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.snips enable row level security;

create policy "Users can manage their own snips"
  on public.snips
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- Compositions table
create table if not exists public.compositions (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid references public.projects(id) on delete cascade not null,
  name         text not null default 'Composition',
  type         text not null default 'single' check (type in ('single', 'collage')),
  config       jsonb not null default '{}',
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.compositions enable row level security;

create policy "Users can manage their own compositions"
  on public.compositions
  for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- Supabase storage bucket for screenshots
insert into storage.buckets (id, name, public)
  values ('screenshots', 'screenshots', false)
  on conflict (id) do nothing;

create policy "Users can upload to their folder"
  on storage.objects
  for insert
  with check (
    bucket_id = 'screenshots' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can read their own screenshots"
  on storage.objects
  for select
  using (
    bucket_id = 'screenshots' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own screenshots"
  on storage.objects
  for delete
  using (
    bucket_id = 'screenshots' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Auto-update updated_at
create or replace function public.handle_updated_at()
  returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at before update on public.projects
  for each row execute procedure public.handle_updated_at();

create trigger snips_updated_at before update on public.snips
  for each row execute procedure public.handle_updated_at();

create trigger compositions_updated_at before update on public.compositions
  for each row execute procedure public.handle_updated_at();
