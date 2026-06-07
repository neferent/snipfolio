-- Profiles table (one row per auth user, created by trigger)
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  is_pro     boolean not null default false,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Only service role can write profiles (admins act via server routes)
create policy "Service role can manage profiles"
  on public.profiles for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Auto-create profile on new signup
create or replace function public.handle_new_user()
  returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Project day-access table ($2.40 one-time, 24-hour window per project)
create table if not exists public.project_export_access (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

alter table public.project_export_access enable row level security;

create policy "Users can read own access"
  on public.project_export_access for select
  using (auth.uid() = user_id);

create policy "Service role can manage access"
  on public.project_export_access for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
