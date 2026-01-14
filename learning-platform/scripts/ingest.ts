import fs from 'fs';
import yaml from 'js-yaml';
import { ModuleManifestSchema, type ModuleManifest, type ModuleNode } from '../lib/schema/manifest';
import { createClient } from '@supabase/supabase-js';

/**
 * Loads a YAML manifest from the given file path.
 */
export function loadManifest(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.load(content);
}

/**
 * Validates the manifest data against the Zod schema.
 */
export function validateManifest(data: any): ModuleManifest {
  return ModuleManifestSchema.parse(data);
}

/**
 * Syncs the module manifest to Supabase.
 */
export async function syncModule(manifest: ModuleManifest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
  const nodesToUpsert: any[] = [];
  const nodeIdsInManifest: string[] = [];

  function flattenNodes(nodes: ModuleNode[], parentId: string | null = null) {
    nodes.forEach((node, index) => {
      nodeIdsInManifest.push(node.id);
      
      const flattenedNode: any = {
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