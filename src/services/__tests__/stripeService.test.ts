import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stripeService } from '@/services/stripeService';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  }
}));

describe('StripeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session successfully', async () => {
      const mockResponse = {
        data: { url: 'https://checkout.stripe.com/pay/cs_test_123' },
        error: null
      };

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.functions.invoke).mockResolvedValue(mockResponse);

      const result = await stripeService.createCheckoutSession('merchant_123', 'starter');

      expect(result.url).toBe('https://checkout.stripe.com/pay/cs_test_123');
      expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout', {
        body: expect.objectContaining({
          merchantId: 'merchant_123',
          planId: 'starter'
        })
      });
    });

    it('should handle checkout session creation errors', async () => {
      const mockError = new Error('Stripe API error');
      
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.functions.invoke).mockResolvedValue({
        data: null,
        error: mockError
      });

      const result = await stripeService.createCheckoutSession('merchant_123', 'starter');

      expect(result.error).toBeTruthy();
      expect(result.url).toBeUndefined();
    });
  });

  describe('getBillingInfo', () => {
    it('should retrieve billing information', async () => {
      const mockBillingData = {
        stripe_customer_id: 'cus_test_123',
        plan_type: 'starter',
        current_period_end: '2024-12-31T00:00:00Z',
        usage_count: 50
      };

      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: mockBillingData,
              error: null
            }))
          }))
        }))
      }) as any);

      const result = await stripeService.getBillingInfo('merchant_123');

      expect(result?.customerId).toBe('cus_test_123');
      expect(result?.plan).toBe('starter');
      expect(result?.usageCount).toBe(50);
    });

    it('should handle missing billing records', async () => {
      const { supabase } = await import('@/integrations/supabase/client');
      vi.mocked(supabase.from).mockImplementation(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: null,
              error: { code: 'PGRST116' }
            }))
          }))
        }))
      }) as any);

      const result = await stripeService.getBillingInfo('merchant_123');
      expect(result).toBeNull();
    });
  });

  describe('plan management', () => {
    it('should return available plans', () => {
      const plans = stripeService.getPlans();
      
      expect(plans).toHaveLength(3);
      expect(plans[0].id).toBe('starter');
      expect(plans[1].id).toBe('growth');
      expect(plans[2].id).toBe('pro');
    });
  });
});