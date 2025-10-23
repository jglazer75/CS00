-- Supabase schema for phase 1.3 progress tracking

create schema if not exists public;

-- Reusable timestamp trigger to keep updated_at in sync
create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.modules (
  id text primary key,
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.module_pages (
  id uuid primary key default gen_random_uuid(),
  module_id text not null references public.modules(id) on delete cascade,
  slug text not null,
  page_id text not null,
  title text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (module_id, slug),
  unique (module_id, page_id)
);

create table if not exists public.user_module_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null references public.modules(id) on delete cascade,
  module_page_id uuid not null references public.module_pages(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  last_viewed_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, module_page_id)
);

create table if not exists public.user_module_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id text not null references public.modules(id) on delete cascade,
  last_module_page_id uuid references public.module_pages(id) on delete set null,
  percent_complete numeric(5,2) check (percent_complete between 0 and 100),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, module_id)
);

drop trigger if exists modules_set_updated_at on public.modules;
create trigger modules_set_updated_at
before update on public.modules
for each row
execute procedure public.set_updated_at_timestamp();

drop trigger if exists module_pages_set_updated_at on public.module_pages;
create trigger module_pages_set_updated_at
before update on public.module_pages
for each row
execute procedure public.set_updated_at_timestamp();

drop trigger if exists user_module_progress_set_updated_at on public.user_module_progress;
create trigger user_module_progress_set_updated_at
before update on public.user_module_progress
for each row
execute procedure public.set_updated_at_timestamp();

drop trigger if exists user_module_state_set_updated_at on public.user_module_state;
create trigger user_module_state_set_updated_at
before update on public.user_module_state
for each row
execute procedure public.set_updated_at_timestamp();

alter table if exists public.modules enable row level security;
alter table if exists public.module_pages enable row level security;
alter table if exists public.user_module_progress enable row level security;
alter table if exists public.user_module_state enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'modules'
      and policyname = 'Modules are readable by authenticated users'
  ) then
    create policy "Modules are readable by authenticated users"
      on public.modules
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'module_pages'
      and policyname = 'Module pages are readable by authenticated users'
  ) then
    create policy "Module pages are readable by authenticated users"
      on public.module_pages
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_module_progress'
      and policyname = 'Users manage their page progress'
  ) then
    create policy "Users manage their page progress"
      on public.user_module_progress
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_module_state'
      and policyname = 'Users manage their module state'
  ) then
    create policy "Users manage their module state"
      on public.user_module_state
      for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

create index if not exists module_pages_module_id_idx on public.module_pages (module_id, sort_order);
create index if not exists user_module_progress_user_idx on public.user_module_progress (user_id, module_id);
create index if not exists user_module_state_user_idx on public.user_module_state (user_id, module_id);
