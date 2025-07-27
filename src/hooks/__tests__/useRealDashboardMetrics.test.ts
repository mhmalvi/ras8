import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRealDashboardMetrics } from '../useRealDashboardMetrics';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('useRealDashboardMetrics', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should calculate metrics from real data', async () => {
    // Mock returns data
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'returns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                data: [
                  { id: '1', status: 'completed', total_amount: 100 },
                  { id: '2', status: 'requested', total_amount: 50 }
                ],
                error: null
              })
            })
          })
        };
      }
      if (table === 'analytics_events') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  data: [
                    { event_type: 'ai_suggestion', event_data: { accepted: true } },
                    { event_type: 'ai_suggestion', event_data: { accepted: false } }
                  ],
                  error: null
                })
              })
            })
          })
        };
      }
    });

    const { result } = renderHook(() => useRealDashboardMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual({
      totalReturns: 2,
      totalRevenue: 150,
      completionRate: 50,
      aiAcceptanceRate: 50
    });
  });

  it('should handle empty data gracefully', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              data: [],
              error: null
            })
          })
        })
      })
    });

    const { result } = renderHook(() => useRealDashboardMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.metrics).toEqual({
      totalReturns: 0,
      totalRevenue: 0,
      completionRate: 0,
      aiAcceptanceRate: 0
    });
  });
});