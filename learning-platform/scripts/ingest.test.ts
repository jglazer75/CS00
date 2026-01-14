import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadManifest, validateManifest } from './ingest';
import fs from 'fs';
import yaml from 'js-yaml';

vi.mock('fs');
vi.mock('js-yaml');

describe('Ingestion Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadManifest', () => {
    it('should read file and parse yaml', () => {
      const mockYaml = 'id: CS01\ntitle: Test';
      const mockParsed = { id: 'CS01', title: 'Test' };
      
      vi.mocked(fs.readFileSync).mockReturnValue(mockYaml);
      vi.mocked(yaml.load).mockReturnValue(mockParsed);

      const result = loadManifest('path/to/module.yaml');
      
      expect(fs.readFileSync).toHaveBeenCalledWith('path/to/module.yaml', 'utf8');
      expect(yaml.load).toHaveBeenCalledWith(mockYaml);
      expect(result).toEqual(mockParsed);
    });
  });

  describe('validateManifest', () => {
    it('should return the manifest if valid', () => {
      const validManifest = {
        id: 'CS01',
        title: 'Test',
        version: '1.0.0',
        navigation: []
      };
      
      const result = validateManifest(validManifest);
      expect(result).toEqual(validManifest);
    });

    it('should throw error if invalid', () => {
      const invalidManifest = { id: 'CS01' };
      expect(() => validateManifest(invalidManifest)).toThrow();
    });
  });
});
