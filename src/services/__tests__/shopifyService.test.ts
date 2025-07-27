import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

// Mock ShopifyService
const ShopifyService = {
  async getShopInfo(merchantId: string) {
    const { data, error } = await supabase.functions.invoke('get-shop-info', {
      body: { merchantId }
    });
    
    if (error) throw new Error(error.message);
    return data;
  },

  async syncOrders(merchantId: string) {
    const { data, error } = await supabase.functions.invoke('sync-orders', {
      body: { merchantId }
    });
    
    if (error) throw new Error(error.message);
    return data;
  },

  async processRefund(merchantId: string, refundData: any) {
    const { data, error } = await supabase.functions.invoke('process-refund', {
      body: { merchantId, ...refundData }
    });
    
    if (error) throw new Error(error.message);
    return data;
  }
};

describe('ShopifyService', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getShopInfo', () => {
    it('should fetch shop information successfully', async () => {
      const mockShop = {
        id: 'shop-123',
        name: 'Test Shop',
        domain: 'testshop.myshopify.com',
        email: 'owner@testshop.com'
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockShop,
        error: null
      });

      const result = await ShopifyService.getShopInfo('merchant-123');
      expect(result).toEqual(mockShop);
    });

    it('should handle API errors', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'API rate limit exceeded' }
      });

      await expect(ShopifyService.getShopInfo('merchant-123'))
        .rejects.toThrow('API rate limit exceeded');
    });
  });

  describe('syncOrders', () => {
    it('should sync orders successfully', async () => {
      const mockOrders = [
        { id: '1', total_price: '99.99', created_at: '2024-01-01' },
        { id: '2', total_price: '149.99', created_at: '2024-01-02' }
      ];

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { orders: mockOrders, synced: 2 },
        error: null
      });

      const result = await ShopifyService.syncOrders('merchant-123');
      expect(result.synced).toBe(2);
      expect(result.orders).toEqual(mockOrders);
    });
  });

  describe('processRefund', () => {
    it('should process refund successfully', async () => {
      const refundData = {
        order_id: '12345',
        amount: 99.99,
        reason: 'Customer request'
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: { refund_id: 'refund-123', status: 'success' },
        error: null
      });

      const result = await ShopifyService.processRefund('merchant-123', refundData);
      expect(result.status).toBe('success');
      expect(result.refund_id).toBe('refund-123');
    });
  });
});