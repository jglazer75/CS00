import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllModuleIds } from './content';
import { getSupabaseServerClient } from './supabase/server';

vi.mock('./supabase/server');

describe('content data layer', () => {
  const mockSupabase = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
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
});
