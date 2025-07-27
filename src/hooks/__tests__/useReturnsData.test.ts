import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useReturnsData } from '../useReturnsData';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('useReturnsData', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch returns data successfully', async () => {
    const mockReturns = [
      {
        id: '1',
        status: 'requested',
        customer_email: 'test@example.com',
        total_amount: 99.99,
        created_at: '2024-01-01'
      }
    ];

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: mockReturns,
            error: null
          })
        })
      })
    });

    const { result } = renderHook(() => useReturnsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.returns).toEqual(mockReturns);
    expect(result.current.error).toBeNull();
  });

  it('should handle loading state', () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
        })
      })
    });

    const { result } = renderHook(() => useReturnsData());

    expect(result.current.loading).toBe(true);
    expect(result.current.returns).toEqual([]);
  });

  it('should handle errors', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })
    });

    const { result } = renderHook(() => useReturnsData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Database connection failed');
    expect(result.current.returns).toEqual([]);
  });
});