
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../orderService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('OrderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('lookupOrder', () => {
    it('should find order with exact match', async () => {
      const mockOrder = {
        id: 'order-1',
        shopify_order_id: '12345',
        customer_email: 'test@example.com',
        total_amount: 100,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        order_items: [
          {
            id: 'item-1',
            product_id: 'prod-1',
            product_name: 'Test Product',
            quantity: 1,
            price: 100
          }
        ]
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockOrder, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await OrderService.lookupOrder('#12345', 'test@example.com');

      expect(result).toEqual({
        ...mockOrder,
        items: mockOrder.order_items
      });

      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(mockQuery.eq).toHaveBeenCalledWith('shopify_order_id', '12345');
      expect(mockQuery.eq).toHaveBeenCalledWith('customer_email', 'test@example.com');
    });

    it('should try alternative search methods when exact match fails', async () => {
      const mockOrder = {
        id: 'order-1',
        shopify_order_id: '#12345',
        customer_email: 'test@example.com',
        total_amount: 100,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        order_items: []
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn()
          .mockResolvedValueOnce({ data: null, error: null }) // First attempt fails
          .mockResolvedValueOnce({ data: mockOrder, error: null }) // Second attempt succeeds
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await OrderService.lookupOrder('12345', 'test@example.com');

      expect(result).toEqual({
        ...mockOrder,
        items: []
      });

      // Should have tried multiple search strategies
      expect(mockQuery.eq).toHaveBeenCalledWith('shopify_order_id', '12345');
      expect(mockQuery.eq).toHaveBeenCalledWith('shopify_order_id', '#12345');
    });

    it('should handle case-insensitive email matching', async () => {
      const mockOrder = {
        id: 'order-1',
        shopify_order_id: '12345',
        customer_email: 'Test@Example.Com',
        total_amount: 100,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        order_items: []
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn()
          .mockResolvedValueOnce({ data: null, error: null }) // Exact match fails
          .mockResolvedValueOnce({ data: null, error: null }) // Prefix match fails
          .mockResolvedValueOnce({ data: mockOrder, error: null }) // Case-insensitive succeeds
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await OrderService.lookupOrder('12345', 'test@example.com');

      expect(result).toEqual({
        ...mockOrder,
        items: []
      });

      expect(mockQuery.ilike).toHaveBeenCalledWith('customer_email', 'test@example.com');
    });

    it('should throw error when order not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        limit: vi.fn().mockReturnThis()
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(OrderService.lookupOrder('99999', 'notfound@example.com'))
        .rejects.toThrow('Order 99999 not found for email notfound@example.com');
    });

    it('should clean order number input', async () => {
      const mockOrder = {
        id: 'order-1',
        shopify_order_id: '12345',
        customer_email: 'test@example.com',
        total_amount: 100,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        order_items: []
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockOrder, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await OrderService.lookupOrder('  #12345  ', '  TEST@EXAMPLE.COM  ');

      expect(mockQuery.eq).toHaveBeenCalledWith('shopify_order_id', '12345');
      expect(mockQuery.eq).toHaveBeenCalledWith('customer_email', 'test@example.com');
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ 
          data: null, 
          error: { message: 'Database connection error' } 
        })
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(OrderService.lookupOrder('12345', 'test@example.com'))
        .rejects.toThrow('Unable to lookup order');
    });
  });
});
