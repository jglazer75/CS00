-- 1. module_ai_settings
create table if not exists public.module_ai_settings (
    module_id text primary key references public.modules(id) on delete cascade,
    provider text not null, -- e.g., 'gemini'
    model text, -- e.g., 'gemini-2.0-flash'
    encrypted_api_key text,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

alter table public.module_ai_settings enable row level security;

-- Policies
-- Read: Authenticated users can read settings (status/model)
-- Note: Service Role (API) will read the key.
create policy "Module AI settings are readable by authenticated users"
    on public.module_ai_settings
    for select
    to authenticated
    using (true);

-- Write: Restrict to service role or authenticated users? 
-- For now, we will handle Admin verification in the Edge Functions/API Route.
-- But we should prevent learners from writing.
-- If we had a 'role' in profiles, we'd use it here.
-- For now, default to deny all writes except Service Role.
create policy "Service role manages module AI settings"
    on public.module_ai_settings
    for all
    using (auth.role() = 'service_role')
    with check (auth.role() = 'service_role');

-- Trigger for updated_at
drop trigger if exists module_ai_settings_set_updated_at on public.module_ai_settings;
create trigger module_ai_settings_set_updated_at
before update on public.module_ai_settings
for each row
execute procedure public.set_updated_at_timestamp();
