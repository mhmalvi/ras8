
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ShopifyService } from '../shopifyService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

// Mock fetch globally
global.fetch = vi.fn();

describe('ShopifyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrder', () => {
    it('should fetch order successfully', async () => {
      const mockAccessToken = 'test-access-token';
      const mockOrder = {
        id: 12345,
        order_number: '#1001',
        email: 'test@example.com',
        total_price: '100.00',
        line_items: [
          {
            id: 1,
            product_id: 100,
            name: 'Test Product',
            price: '100.00',
            quantity: 1
          }
        ]
      };

      // Mock getAccessToken
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { access_token: mockAccessToken }, 
          error: null 
        })
      };

      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any);

      // Mock Shopify API response
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ orders: [mockOrder] })
      } as Response);

      const result = await ShopifyService.getOrder(
        'merchant-1',
        'test-store',
        '#1001',
        'test@example.com'
      );

      expect(result).toEqual(mockOrder);
      expect(fetch).toHaveBeenCalledWith(
        'https://test-store.myshopify.com/admin/api/2023-10/orders.json?name=#1001&email=test@example.com&limit=1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Shopify-Access-Token': mockAccessToken
          })
        })
      );
    });

    it('should return null when no access token', async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { access_token: 'DISCONNECTED' }, 
          error: null 
        })
      };

      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any);

      const result = await ShopifyService.getOrder(
        'merchant-1',
        'test-store',
        '#1001',
        'test@example.com'
      );

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { access_token: 'test-token' }, 
          error: null 
        })
      };

      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any);

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      const result = await ShopifyService.getOrder(
        'merchant-1',
        'test-store',
        '#1001',
        'test@example.com'
      );

      expect(result).toBeNull();
    });
  });

  describe('syncOrdersToDatabase', () => {
    it('should sync orders successfully', async () => {
      const mockAccessToken = 'test-access-token';
      const mockOrders = [
        {
          id: 12345,
          email: 'test@example.com',
          total_price: '100.00',
          created_at: '2024-01-01T00:00:00Z',
          line_items: [
            {
              id: 1,
              product_id: 100,
              name: 'Test Product',
              price: '100.00',
              quantity: 1
            }
          ]
        }
      ];

      // Mock getAccessToken
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { access_token: mockAccessToken }, 
          error: null 
        })
      };

      // Mock order upsert
      const mockUpsertQuery = {
        upsert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { id: 'order-uuid' }, 
          error: null 
        })
      };

      // Mock items upsert
      const mockItemsQuery = {
        upsert: vi.fn().mockResolvedValue({ error: null })
      };

      // Mock analytics insert
      const mockAnalyticsQuery = {
        insert: vi.fn().mockResolvedValue({ error: null })
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce(mockSelectQuery as any) // getAccessToken
        .mockReturnValueOnce(mockUpsertQuery as any) // orders upsert
        .mockReturnValueOnce(mockItemsQuery as any) // order_items upsert
        .mockReturnValueOnce(mockAnalyticsQuery as any); // analytics insert

      // Mock Shopify API response
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ orders: mockOrders })
      } as Response);

      const result = await ShopifyService.syncOrdersToDatabase('merchant-1', 'test-store');

      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateWebhook', () => {
    it('should validate webhook signature correctly', async () => {
      const data = 'test webhook data';
      const secret = 'webhook-secret';
      
      // Mock crypto.subtle
      const mockSignature = new Uint8Array([1, 2, 3, 4]);
      const mockCrypto = {
        subtle: {
          importKey: vi.fn().mockResolvedValue('mock-key'),
          sign: vi.fn().mockResolvedValue(mockSignature.buffer)
        }
      };

      Object.defineProperty(global, 'crypto', {
        value: mockCrypto,
        writable: true
      });

      // Mock btoa
      global.btoa = vi.fn().mockReturnValue('test-signature');

      const result = await ShopifyService.validateWebhook(data, 'test-signature', secret);

      expect(result).toBe(true);
      expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.sign).toHaveBeenCalled();
    });

    it('should handle validation errors', async () => {
      const mockCrypto = {
        subtle: {
          importKey: vi.fn().mockRejectedValue(new Error('Crypto error')),
          sign: vi.fn()
        }
      };

      Object.defineProperty(global, 'crypto', {
        value: mockCrypto,
        writable: true
      });

      const result = await ShopifyService.validateWebhook('data', 'signature', 'secret');

      expect(result).toBe(false);
    });
  });

  describe('testConnection', () => {
    it('should test connection successfully', async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { access_token: 'test-token' }, 
          error: null 
        })
      };

      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any);

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ shop: { name: 'Test Shop' } })
      } as Response);

      const result = await ShopifyService.testConnection('merchant-1', 'test-store');

      expect(result.success).toBe(true);
    });

    it('should handle connection failure', async () => {
      const mockSelectQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ 
          data: { access_token: 'test-token' }, 
          error: null 
        })
      };

      vi.mocked(supabase.from).mockReturnValue(mockSelectQuery as any);

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as Response);

      const result = await ShopifyService.testConnection('merchant-1', 'test-store');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Shopify API error');
    });
  });
});
