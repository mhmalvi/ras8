
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ReturnService } from '../returnService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('ReturnService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchCustomerReturns', () => {
    it('should fetch returns for customer email', async () => {
      const mockReturns = [
        {
          id: 'return-1',
          shopify_order_id: '12345',
          customer_email: 'test@example.com',
          status: 'requested',
          reason: 'Size issue',
          total_amount: 100,
          created_at: '2024-01-01T00:00:00Z',
          return_items: [
            {
              id: 'item-1',
              product_name: 'Test Product',
              quantity: 1,
              price: 100,
              action: 'refund'
            }
          ]
        }
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.select.mockResolvedValue({ data: mockReturns, error: null });

      const result = await ReturnService.fetchCustomerReturns('test@example.com');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('return-1');
      expect(result[0].items).toEqual(mockReturns[0].return_items);
      expect(supabase.from).toHaveBeenCalledWith('returns');
    });

    it('should handle database errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);
      mockQuery.select.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });

      await expect(ReturnService.fetchCustomerReturns('test@example.com'))
        .rejects.toThrow();
    });
  });

  describe('submitReturn', () => {
    it('should submit return successfully', async () => {
      const mockOrder = {
        items: [
          {
            id: 'item-1',
            product_id: 'prod-1',
            product_name: 'Test Product',
            price: 50,
            quantity: 2
          }
        ]
      };

      const mockReturnData = {
        orderNumber: '#12345',
        email: 'test@example.com',
        selectedItems: ['item-1'],
        returnReasons: { 'item-1': 'Size issue' }
      };

      const mockReturnRecord = {
        id: 'return-1',
        shopify_order_id: '12345',
        customer_email: 'test@example.com'
      };

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReturnRecord, error: null })
      };

      const mockItemsQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockInsertQuery as any)
        .mockReturnValueOnce(mockItemsQuery as any);

      const result = await ReturnService.submitReturn(mockReturnData, mockOrder);

      expect(result.returnId).toBe('return-1');
      expect(mockInsertQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          shopify_order_id: '12345',
          customer_email: 'test@example.com',
          reason: 'Size issue',
          total_amount: 100,
          status: 'requested'
        })
      );
    });

    it('should throw error when no items selected', async () => {
      const mockOrder = {
        items: [
          { id: 'item-1', product_id: 'prod-1', product_name: 'Test Product', price: 50, quantity: 1 }
        ]
      };

      const mockReturnData = {
        orderNumber: '#12345',
        email: 'test@example.com',
        selectedItems: [],
        returnReasons: {}
      };

      await expect(ReturnService.submitReturn(mockReturnData, mockOrder))
        .rejects.toThrow('No items selected for return');
    });

    it('should throw error when order not found', async () => {
      const mockReturnData = {
        orderNumber: '#12345',
        email: 'test@example.com',
        selectedItems: ['item-1'],
        returnReasons: { 'item-1': 'Size issue' }
      };

      await expect(ReturnService.submitReturn(mockReturnData, null))
        .rejects.toThrow('Order not found');
    });
  });

  describe('updateReturn', () => {
    it('should update return successfully', async () => {
      const mockReturn = {
        id: 'return-1',
        status: 'requested',
        return_items: []
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReturn, error: null })
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockUpdateQuery as any);

      const result = await ReturnService.updateReturn('return-1', {
        returnReasons: { 'item-1': 'Updated reason' }
      });

      expect(result.success).toBe(true);
      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Updated reason'
        })
      );
    });

    it('should throw error for processed returns', async () => {
      const mockReturn = {
        id: 'return-1',
        status: 'completed',
        return_items: []
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReturn, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any);

      await expect(ReturnService.updateReturn('return-1', {}))
        .rejects.toThrow('This return cannot be modified as it has already been processed');
    });
  });

  describe('cancelReturn', () => {
    it('should cancel return successfully', async () => {
      const mockReturn = {
        id: 'return-1',
        status: 'requested'
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReturn, error: null })
      };

      const mockDeleteQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null })
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as any)
        .mockReturnValueOnce(mockDeleteQuery as any);

      const result = await ReturnService.cancelReturn('return-1');

      expect(result.success).toBe(true);
      expect(mockDeleteQuery.delete).toHaveBeenCalled();
    });

    it('should throw error for processed returns', async () => {
      const mockReturn = {
        id: 'return-1',
        status: 'approved'
      };

      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockReturn, error: null })
      };

      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any);

      await expect(ReturnService.cancelReturn('return-1'))
        .rejects.toThrow('This return cannot be cancelled as it has already been processed');
    });
  });
});
