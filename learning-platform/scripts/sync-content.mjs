#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const contentDir = path.join(projectRoot, 'content');

const supabaseUrl = process.env.SUPABASE_SERVICE_ROLE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Ensure NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_SERVICE_ROLE_URL) and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

const moduleMetadataOverrides = {
  CS01: {
    title: 'Venture Capital Term Sheet Negotiation',
    description: 'An interactive case study on negotiating a venture capital term sheet.',
  },
};

function readMarkdownFiles(moduleId) {
  const modulePath = path.join(contentDir, moduleId);
  const files = fs
    .readdirSync(modulePath, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  return files.map((filename, index) => {
    const fullPath = path.join(modulePath, filename);
    const slug = filename.replace(/\.md$/i, '');
    const { data } = matter.read(fullPath);
    const title = typeof data.title === 'string' && data.title.trim().length > 0 ? data.title.trim() : slugToTitle(slug);
    const description = typeof data.description === 'string' ? data.description.trim() : null;
    const pageId =
      typeof data.pageId === 'string' && data.pageId.trim().length > 0
        ? data.pageId.trim()
        : `${moduleId}_${slug}`;

    return {
      moduleId,
      slug,
      title,
      description,
      pageId,
      sortOrder: index,
    };
  });
}

function slugToTitle(slug) {
  return slug
    .replace(/^[0-9]+[-_]?/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

async function syncModule(moduleId) {
  const pages = readMarkdownFiles(moduleId);

  if (pages.length === 0) {
    console.warn(`No markdown content found for module "${moduleId}". Skipping.`);
    return;
  }

  const override = moduleMetadataOverrides[moduleId] ?? {};
  const title = override.title ?? slugToTitle(moduleId);
  const description = override.description ?? pages[0].description ?? null;

  const { error: moduleError } = await supabase
    .from('modules')
    .upsert(
      {
        id: moduleId,
        title,
        description,
        is_active: true,
      },
      { onConflict: 'id' }
    );

  if (moduleError) {
    throw new Error(`Failed to upsert module "${moduleId}": ${moduleError.message}`);
  }

  const pagePayload = pages.map(({ slug, title: pageTitle, description, pageId, sortOrder }) => ({
    module_id: moduleId,
    slug,
    title: pageTitle,
    description,
    page_id: pageId,
    sort_order: sortOrder,
    is_active: true,
  }));

  const { error: pagesError } = await supabase
    .from('module_pages')
    .upsert(pagePayload, { onConflict: 'module_id,slug' });

  if (pagesError) {
    throw new Error(`Failed to upsert pages for module "${moduleId}": ${pagesError.message}`);
  }

  console.info(`Synced module "${moduleId}" with ${pages.length} pages.`);
}

async function main() {
  const moduleDirs = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

  for (const moduleId of moduleDirs) {
    await syncModule(moduleId);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
