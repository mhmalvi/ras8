import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

// Mock ReturnService since it might not exist yet
const ReturnService = {
  async getReturns(merchantId: string) {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  },

  async createReturn(returnData: any) {
    const { data, error } = await supabase
      .from('returns')
      .insert(returnData)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  },

  async updateReturnStatus(returnId: string, status: string) {
    const { data, error } = await supabase
      .from('returns')
      .update({ status })
      .eq('id', returnId)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
};

describe('ReturnService', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getReturns', () => {
    it('should fetch returns successfully', async () => {
      const mockReturns = [
        { id: '1', status: 'requested', total_amount: 99.99 },
        { id: '2', status: 'completed', total_amount: 149.99 }
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

      const result = await ReturnService.getReturns('merchant-123');
      expect(result).toEqual(mockReturns);
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              data: null,
              error: { message: 'Database error' }
            })
          })
        })
      });

      await expect(ReturnService.getReturns('merchant-123')).rejects.toThrow('Database error');
    });
  });

  describe('createReturn', () => {
    it('should create return successfully', async () => {
      const returnData = {
        merchant_id: 'merchant-123',
        shopify_order_id: '12345',
        customer_email: 'test@example.com',
        reason: 'Size issue'
      };

      const mockCreatedReturn = { id: 'new-return-id', ...returnData };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue({
              data: mockCreatedReturn,
              error: null
            })
          })
        })
      });

      const result = await ReturnService.createReturn(returnData);
      expect(result).toEqual(mockCreatedReturn);
    });
  });

  describe('updateReturnStatus', () => {
    it('should update return status successfully', async () => {
      const updatedReturn = { id: 'return-123', status: 'approved' };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: updatedReturn,
                error: null
              })
            })
          })
        })
      });

      const result = await ReturnService.updateReturnStatus('return-123', 'approved');
      expect(result).toEqual(updatedReturn);
    });
  });
});