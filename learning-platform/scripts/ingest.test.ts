import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadManifest, validateManifest, syncModule } from './ingest';
import fs from 'fs';
import yaml from 'js-yaml';
import { createClient } from '@supabase/supabase-js';

vi.mock('fs');
vi.mock('js-yaml');
vi.mock('@supabase/supabase-js');

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

  describe('syncModule', () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockResolvedValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      not: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnThis(),
    };

    beforeEach(() => {
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.com';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    });

    it('should upsert module and nodes including nested sections and ai-interactions', async () => {
      const manifest = {
        id: 'CS01',
        title: 'Test Module',
        version: '1.0.0',
        navigation: [
          { id: 'page1', title: 'Page 1', type: 'page', content_source: 'p1.md', layout: 'reader' },
          {
            id: 'section1',
            title: 'Section 1',
            type: 'section',
            children: [
              { id: 'page2', title: 'Page 2', type: 'page', content_source: 'p2.md' }
            ] 
          },
          {
            id: 'ai1',
            title: 'AI 1',
            type: 'ai-interaction',
            config: { ai_task_id: 'task1' },
            layout: 'immersive'
          }
        ]
      };

      await syncModule(manifest as any);

      // Verify module upsert
      expect(mockSupabase.from).toHaveBeenCalledWith('modules');
      expect(mockSupabase.upsert).toHaveBeenCalledWith({
        id: 'CS01',
        title: 'Test Module',
        description: undefined,
        is_active: true
      });

      // Verify node upsert
      expect(mockSupabase.from).toHaveBeenCalledWith('module_nodes');
      expect(mockSupabase.upsert).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ node_id: 'page1', type: 'page' }),
        expect.objectContaining({ node_id: 'section1', type: 'section' }),
        expect.objectContaining({ node_id: 'page2', type: 'page', parent_node_id: 'section1' }),
        expect.objectContaining({ node_id: 'ai1', type: 'ai-interaction' })
      ]), expect.any(Object));
    });

    it('should throw if module upsert fails', async () => {
        mockSupabase.upsert.mockResolvedValueOnce({ error: new Error('fail') });
        await expect(syncModule({ id: 'CS01' } as any)).rejects.toThrow('fail');
    });

    it('should throw if node upsert fails', async () => {
        mockSupabase.upsert.mockResolvedValueOnce({ error: null }); // module success
        mockSupabase.upsert.mockResolvedValueOnce({ error: new Error('fail nodes') }); // nodes fail
        await expect(syncModule({ id: 'CS01', navigation: [] } as any)).rejects.toThrow('fail nodes');
    });
  });
});