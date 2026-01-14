-- Create module_nodes table
create table if not exists public.module_nodes (
  id uuid primary key default gen_random_uuid(),
  module_id text references public.modules(id) on delete cascade,
  node_id text not null,
  parent_node_id text,
  type text not null check (type in ('page', 'section', 'ai-interaction')),
  title text not null,
  content_source text,
  visibility_rules jsonb,
  config jsonb,
  metadata jsonb,
  sort_order integer not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(module_id, node_id)
);

-- Enable RLS
alter table public.module_nodes enable row level security;

-- Create Policy for read access
create policy "Module nodes are readable by authenticated users"
  on public.module_nodes
  for select
  to authenticated
  using (true);

-- Create Policy for service role (full access)
create policy "Service role has full access to module_nodes"
  on public.module_nodes
  for all
  to service_role
  using (true)
  with check (true);

-- Add updated_at trigger
create trigger module_nodes_set_updated_at
  before update on public.module_nodes
  for each row
  execute procedure public.set_updated_at_timestamp();
