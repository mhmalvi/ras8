import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

// Mock OrderService
const OrderService = {
  async lookupOrder(orderNumber: string, email: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('shopify_order_id', orderNumber)
      .eq('customer_email', email)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(error.message);
    }
    return data;
  },

  async getOrderItems(orderId: string) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    
    if (error) throw new Error(error.message);
    return data;
  }
};

describe('OrderService', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lookupOrder', () => {
    it('should find order by order number and email', async () => {
      const mockOrder = {
        id: 'order-123',
        shopify_order_id: '12345',
        customer_email: 'test@example.com',
        total_amount: 199.99,
        order_items: [
          { id: 'item-1', product_name: 'Test Product', quantity: 1 }
        ]
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: mockOrder,
                error: null
              })
            })
          })
        })
      });

      const result = await OrderService.lookupOrder('12345', 'test@example.com');
      expect(result).toEqual(mockOrder);
    });

    it('should return null when order not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: null,
                error: { code: 'PGRST116' } // Not found error
              })
            })
          })
        })
      });

      const result = await OrderService.lookupOrder('99999', 'notfound@example.com');
      expect(result).toBeNull();
    });

    it('should throw error for database issues', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: null,
                error: { message: 'Connection failed' }
              })
            })
          })
        })
      });

      await expect(OrderService.lookupOrder('12345', 'test@example.com'))
        .rejects.toThrow('Connection failed');
    });
  });

  describe('getOrderItems', () => {
    it('should fetch order items successfully', async () => {
      const mockItems = [
        { id: 'item-1', product_name: 'Product A', quantity: 2 },
        { id: 'item-2', product_name: 'Product B', quantity: 1 }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            data: mockItems,
            error: null
          })
        })
      });

      const result = await OrderService.getOrderItems('order-123');
      expect(result).toEqual(mockItems);
    });
  });
});