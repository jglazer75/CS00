import fs from 'fs';
import yaml from 'js-yaml';
import { ModuleManifestSchema, type ModuleManifest } from '../lib/schema/manifest';

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