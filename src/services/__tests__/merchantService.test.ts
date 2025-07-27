import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MerchantService } from '../merchantService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('MerchantService', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCurrentMerchant', () => {
    it('should fetch current merchant successfully', async () => {
      const mockMerchant = {
        id: 'merchant-id',
        shop_domain: 'test-shop.myshopify.com',
        plan_type: 'Growth'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: mockMerchant,
            error: null
          })
        })
      });

      const result = await MerchantService.getCurrentMerchant();

      expect(result).toEqual(mockMerchant);
    });

    it('should handle merchant not found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({
            data: null,
            error: { message: 'Not found' }
          })
        })
      });

      const result = await MerchantService.getCurrentMerchant();
      expect(result).toBeNull();
    });
  });

  describe('updateMerchantSettings', () => {
    it('should update merchant settings successfully', async () => {
      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            error: null
          })
        })
      });

      await expect(MerchantService.updateMerchantSettings('merchant-id', { theme: 'dark' }))
        .resolves.not.toThrow();
    });
  });
});