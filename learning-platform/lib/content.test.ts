import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllModuleIds, getModuleStructure } from './content';
import { getSupabaseServerClient } from './supabase/server';

vi.mock('./supabase/server');

describe('content data layer', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSupabaseServerClient).mockReturnValue(mockSupabase as any);
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
});
