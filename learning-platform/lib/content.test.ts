import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllModuleIds, getModuleStructure, getPageData, getModulePages } from './content';
import { getSupabaseServerClient } from './supabase/server';
import fs from 'fs';

vi.mock('./supabase/server');
vi.mock('fs');

describe('content data layer', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockImplementation(async () => ({ data: [], error: null })),
      order: vi.fn().mockImplementation(async () => ({ data: [], error: null })),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabase as any);
  });

  describe('getModulePages', () => {
    it('should return a flat list of pages from module structure', async () => {
      const mockNodes = [
        { node_id: 'p1', parent_node_id: null, type: 'page', title: 'Page 1', sort_order: 1 },
        { node_id: 's1', parent_node_id: null, type: 'section', title: 'Section 1', sort_order: 2 },
        { node_id: 'p2', parent_node_id: 's1', type: 'page', title: 'Page 2', sort_order: 1 }
      ];

      mockSupabase.order.mockResolvedValueOnce({ data: mockNodes, error: null });

      const result = await getModulePages('CS01');

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('p1');
      expect(result[1].slug).toBe('p2');
    });
  });

  describe('getAllModuleIds', () => {
    it('should fetch module IDs from Supabase', async () => {
      const mockModules = [
        { id: 'CS01' },
        { id: 'CS02' }
      ];
      
      mockSupabase.order.mockResolvedValueOnce({ data: mockModules, error: null });

      const result = await getAllModuleIds();

      expect(mockSupabase.from).toHaveBeenCalledWith('modules');
      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(result).toEqual([
        { params: { moduleId: 'CS01' } },
        { params: { moduleId: 'CS02' } }
      ]);
    });

    it('should throw if Supabase query fails', async () => {
      mockSupabase.order.mockResolvedValueOnce({ data: null, error: { message: 'DB Error' } });

      await expect(getAllModuleIds()).rejects.toThrow('DB Error');
    });
  });

  describe('getModuleStructure', () => {
    it('should fetch and reconstruct module structure', async () => {
      const mockNodes = [
        { node_id: 'p1', parent_node_id: null, type: 'page', title: 'Page 1', sort_order: 1 },
        { node_id: 's1', parent_node_id: null, type: 'section', title: 'Section 1', sort_order: 2 },
        { node_id: 'p2', parent_node_id: 's1', type: 'page', title: 'Page 2', sort_order: 1 }
      ];

      mockSupabase.order.mockResolvedValueOnce({ data: mockNodes, error: null });

      const result = await getModuleStructure('CS01');

      expect(mockSupabase.from).toHaveBeenCalledWith('module_nodes');
      expect(mockSupabase.select).toHaveBeenCalled();
      expect(mockSupabase.order).toHaveBeenCalledWith('sort_order');
      
      expect(result).toEqual([
        { id: 'p1', title: 'Page 1', type: 'page', children: [] },
        { id: 's1', title: 'Section 1', type: 'section', children: [
          { id: 'p2', title: 'Page 2', type: 'page', children: [] }
        ]}
      ]);
    });
  });

  describe('getPageData', () => {
    it('should fetch metadata from DB and content from filesystem', async () => {
      const mockNode = {
        node_id: 'foundations',
        module_id: 'CS01',
        type: 'page',
        title: 'Foundations of VC',
        content_source: 'foundations.md',
        metadata: {
          learning_objectives: ['Obj 1'],
          core_concepts: ['Concept 1'],
          keywords: ['Term 1']
        }
      };

      const mockMarkdown = '---\ntitle: Ignore Me\n---\n## Section 1\nContent';

      mockSupabase.limit.mockResolvedValueOnce({ data: [mockNode], error: null });
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readFileSync).mockReturnValue(mockMarkdown);
      vi.mocked(fs.readdirSync).mockReturnValue([]);

      const result = await getPageData('CS01', 'foundations');

      expect(mockSupabase.from).toHaveBeenCalledWith('module_nodes');
      expect(mockSupabase.eq).toHaveBeenCalledWith('module_id', 'CS01');
      expect(mockSupabase.eq).toHaveBeenCalledWith('node_id', 'foundations');
      
      expect(result.metadata.title).toBe('Foundations of VC');
      expect(result.metadata.learningObjectives).toEqual(['Obj 1']);
      expect(result.chunks[0].heading).toBe('Section 1');
    });

    it('should throw if node not found in DB', async () => {
      mockSupabase.limit.mockResolvedValueOnce({ data: [], error: null });

      await expect(getPageData('CS01', 'missing')).rejects.toThrow('Module node "missing" not found in module "CS01"');
    });
  });
});
