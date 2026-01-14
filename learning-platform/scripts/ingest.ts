import fs from 'fs';
import yaml from 'js-yaml';
import { ModuleManifestSchema, type ModuleManifest, type ModuleNode } from '../lib/schema/manifest';
import { createClient } from '@supabase/supabase-js';
import path from 'path';

/**
 * Loads a YAML manifest from the given file path.
 */
export function loadManifest(filePath: string): unknown {
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content);
}

/**
 * Validates the manifest data against the Zod schema.
 */
export function validateManifest(data: unknown): ModuleManifest {
  return ModuleManifestSchema.parse(data);
}

/**
 * Verifies that all content_source files referenced in the manifest exist on disk.
 */
export function verifyFiles(manifest: ModuleManifest, moduleDirectory: string) {
  function checkNodes(nodes: ModuleNode[]) {
    nodes.forEach((node) => {
      if (node.type === 'page' && node.content_source) {
        const fullPath = path.join(moduleDirectory, node.content_source);
        if (!fs.existsSync(fullPath)) {
          throw new Error(`File missing at ${fullPath}`);
        }
      } else if (node.type === 'section') {
        if (node.content_source) {
          const fullPath = path.join(moduleDirectory, node.content_source);
          if (!fs.existsSync(fullPath)) {
            throw new Error(`File missing at ${fullPath}`);
          }
        }
        checkNodes(node.children || []);
      }
    });
  }

  checkNodes(manifest.navigation);
}

/**
 * Syncs the module manifest to Supabase.
 */
export async function syncModule(manifest: ModuleManifest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Upsert the module itself
  const { error: moduleError } = await supabase.from('modules').upsert({
    id: manifest.id,
    title: manifest.title,
    description: manifest.description,
    is_active: true,
  });

  if (moduleError) throw moduleError;

  // 2. Prepare nodes for recursive flattening
  const nodesToUpsert: Record<string, unknown>[] = [];
  const nodeIdsInManifest: string[] = [];

  function flattenNodes(nodes: ModuleNode[], parentId: string | null = null) {
    nodes.forEach((node, index) => {
      nodeIdsInManifest.push(node.id);
      
      const flattenedNode: Record<string, unknown> = {
        module_id: manifest.id,
        node_id: node.id,
        parent_node_id: parentId,
        type: node.type,
        title: node.title,
        visibility_rules: node.visibility,
        metadata: node.metadata,
        sort_order: index,
      };

      if (node.type === 'page') {
        flattenedNode.content_source = node.content_source;
        flattenedNode.config = { layout: node.layout };
      } else if (node.type === 'ai-interaction') {
        flattenedNode.config = { ...node.config, layout: node.layout };
      } else if (node.type === 'section') {
        flattenedNode.content_source = node.content_source;
        flattenedNode.config = { layout: node.layout, layout_config: node.layout_config };
        flattenNodes(node.children || [], node.id);
      }

      nodesToUpsert.push(flattenedNode);
    });
  }

  flattenNodes(manifest.navigation);

  // 3. Upsert nodes
  const { error: nodesError } = await supabase.from('module_nodes').upsert(nodesToUpsert, {
    onConflict: 'module_id,node_id',
  });

  if (nodesError) throw nodesError;

  // 4. Delete nodes no longer in manifest
  const { error: deleteError } = await supabase
    .from('module_nodes')
    .delete()
    .eq('module_id', manifest.id)
    .not('node_id', 'in', `(${nodeIdsInManifest.join(',')})`);

  if (deleteError) throw deleteError;
}

async function main() {
  const contentDir = path.join(process.cwd(), 'content');
  const moduleDirs = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name);

  for (const moduleId of moduleDirs) {
    const moduleDir = path.join(contentDir, moduleId);
    const manifestPath = path.join(moduleDir, 'module.yaml');

    if (fs.existsSync(manifestPath)) {
      console.log(`Processing module: ${moduleId}`);
      try {
        const raw = loadManifest(manifestPath);
        const manifest = validateManifest(raw);
        verifyFiles(manifest, moduleDir);
        await syncModule(manifest);
        console.log(`Successfully synced module: ${moduleId}`);
      } catch (error) {
        console.error(`Failed to sync module ${moduleId}:`, error);
      }
    } else {
      console.log(`No module.yaml found for ${moduleId}, skipping.`);
    }
  }
}

// Check if we are running as a script
if (process.argv[1] && (process.argv[1].endsWith('ingest.ts') || process.argv[1].endsWith('ingest'))) {
    main().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
