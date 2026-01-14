import { describe, it, expect } from 'vitest';
import { loadManifest, validateManifest, verifyFiles } from '../../scripts/ingest';
import path from 'path';

describe('CS01 Module Manifest', () => {
  const moduleDir = path.join(__dirname, '.');
  const manifestPath = path.join(moduleDir, 'module.yaml');

  it('should be a valid manifest', () => {
    const data = loadManifest(manifestPath);
    const manifest = validateManifest(data);
    expect(manifest.id).toBe('CS01');
  });

  it('should reference existing files', () => {
    const data = loadManifest(manifestPath);
    const manifest = validateManifest(data);
    expect(() => verifyFiles(manifest, moduleDir)).not.toThrow();
  });
});
