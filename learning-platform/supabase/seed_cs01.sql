insert into public.modules (id, title, description, is_active) values
  ('CS01', 'Venture Capital Term Sheet Negotiation', 'An interactive case study on negotiating a venture capital term sheet.', true)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

with pages as (
    select 'CS01'::text as module_id, '01-foundations'::text as slug, 'CS01_01-foundations'::text as page_id, 'Module 1: Foundations – The Setup & The Stakes'::text as title, 0::int as sort_order union all
    select 'CS01'::text as module_id, '02-Negotiating-term-sheets'::text as slug, 'CS01_02-Negotiating-term-sheets'::text as page_id, 'Module 2: Negotiating Term Sheets'::text as title, 1::int as sort_order union all
    select 'CS01'::text as module_id, '02-the-deal'::text as slug, 'CS01_02-the-deal'::text as page_id, 'Module 2: The Deal - Deconstructing the Term Sheet'::text as title, 2::int as sort_order union all
    select 'CS01'::text as module_id, '03-bigtech-confidential'::text as slug, 'CS01_03-bigtech-confidential'::text as page_id, 'CONFIDENTIAL: For BigTech Eyes Only'::text as title, 3::int as sort_order union all
    select 'CS01'::text as module_id, '03-the-exercise'::text as slug, 'CS01_03-the-exercise'::text as page_id, 'The Negotiation'::text as title, 4::int as sort_order union all
    select 'CS01'::text as module_id, '04-financials'::text as slug, 'CS01_04-financials'::text as page_id, 'Module 4: Startup Finances'::text as title, 5::int as sort_order union all
    select 'CS01'::text as module_id, '05-pitch-competition'::text as slug, 'CS01_05-pitch-competition'::text as page_id, 'Module 5: Pitch Competition'::text as title, 6::int as sort_order union all
    select 'CS01'::text as module_id, 'tips'::text as slug, 'CS01_tips'::text as page_id, 'Some Tips on Negotiating'::text as title, 7::int as sort_order
)
insert into public.module_pages (module_id, slug, page_id, title, sort_order)
select module_id, slug, page_id, title, sort_order
from pages
on conflict (module_id, slug) do update set
  page_id = excluded.page_id,
  title = excluded.title,
  sort_order = excluded.sort_order,
  updated_at = timezone('utc', now());

