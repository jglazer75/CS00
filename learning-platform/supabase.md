# Supabase Integration Notes

## Environment Variables

Create a `.env.local` file with the Supabase credentials for your project before running the app locally:

```
NEXT_PUBLIC_SUPABASE_URL=https://mousqbknairepmemqicd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdXNxYmtuYWlyZXBtZW1xaWNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3NzgyNTksImV4cCI6MjA3NjM1NDI1OX0.M8lXdR3ndaMFoFBPwmsi5ESkvLfxXbC6zRZqh5OtSMc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vdXNxYmtuYWlyZXBtZW1xaWNkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDc3ODI1OSwiZXhwIjoyMDc2MzU0MjU5fQ.FdCYgUnEqNthh8V9UTY4VDDgPbbv95NrIkRrPv0IjYg
SUPABASE_SERVICE_ROLE_URL=https://mousqbknairepmemqicd.supabase.co # optional override, defaults to NEXT_PUBLIC_SUPABASE_URL
```

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are safe for usage in the browser.
- `SUPABASE_SERVICE_ROLE_KEY` must remain server-side only and will power future server actions (do not expose it to clients).
- `SUPABASE_SERVICE_ROLE_URL` is optional; set it if you want service scripts to point at a different Supabase instance than the public client.

Additional environment variables will be documented here as new Supabase-backed features are implemented.

## Database Schema

The schema for Phase 1.3 progress tracking lives in `supabase/schema.sql` and creates:

- `modules` and `module_pages` to mirror the content folder structure with stable IDs and ordering for joins.
- `user_module_progress` to record per-page completion/status with RLS limiting access to the owning user.
- `user_module_state` to track the last page visited and aggregate completion percentage per module.

Apply the script through the Supabase SQL editor or CLI to bootstrap the tables, triggers, and policies.

## Seed Data

Initial content for the pilot module can be loaded via `supabase/seed_cs01.sql`. Run it after the schema script to populate:

- `modules` with the CS01 metadata (`Venture Capital Term Sheet Negotiation`).
- `module_pages` with each markdown page mapped to a stable `page_id` (e.g., `CS01_01-foundations`).

Re-run the seed when content metadata changes; the statements use `ON CONFLICT` to perform idempotent updates.

For larger updates, prefer the automation script: `npm run sync:content` reads the markdown frontmatter and upserts module/page metadata via the Supabase service key. It is safe to re-run anytime you add or rename content files.
