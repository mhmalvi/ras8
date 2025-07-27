import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AnalyticsService } from '../analyticsService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('AnalyticsService', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAnalytics', () => {
    it('should fetch analytics successfully', async () => {
      const mockData = [
        { event_type: 'return_submitted', event_data: { value: 100 } },
        { event_type: 'exchange_processed', event_data: { value: 50 } }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: mockData,
            error: null
          })
        })
      });

      const result = await AnalyticsService.getAnalytics('30days');

      expect(result).toEqual(mockData);
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      });

      await expect(AnalyticsService.getAnalytics('30days')).rejects.toThrow('Database error');
    });
  });
});