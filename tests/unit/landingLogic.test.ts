/**
 * Landing Logic Unit Tests
 * 
 * Tests the core landing decision logic as specified in the audit report.
 * Validates all decision paths for new vs returning users.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveLandingRoute, LandingContext, LandingDecision } from '../../src/utils/landingResolver';

// Mock Supabase client using hoisted mock
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn()
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

// Mock data
const mockProfile = {
  id: 'user1',
  merchant_id: 'merchant1',
  email: 'test@example.com',
  role: 'admin',
  first_name: 'Test',
  last_name: 'User'
};

const mockMasterAdminProfile = {
  ...mockProfile,
  role: 'master_admin'
};

const mockNewUserProfile = {
  ...mockProfile,
  merchant_id: null
};

const mockIntegrationStatus = {
  has_merchant_link: true,
  merchant_status: 'active',
  token_valid: true,
  token_fresh: true,
  integration_status: 'integrated-active'
};

const mockUninstalledStatus = {
  has_merchant_link: true,
  merchant_status: 'uninstalled',
  token_valid: false,
  token_fresh: false,
  integration_status: 'uninstalled'
};

const mockNewUserStatus = {
  has_merchant_link: false,
  merchant_status: null,
  token_valid: null,
  token_fresh: null,
  integration_status: 'no-merchant-link'
};

describe('Landing Logic Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Returning integrated user', () => {
    test('should route to /dashboard for integrated-active users', async () => {
      // Mock profile fetch
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      // Mock integration status
      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockIntegrationStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/dashboard',
        reason: 'integrated-active'
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.rpc).toHaveBeenCalledWith('validate_merchant_integration', { p_user_id: 'user1' });
    });

    test('should work for embedded context as well', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockIntegrationStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: true,
        shopDomain: 'test-store.myshopify.com',
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/dashboard',
        reason: 'integrated-active'
      });
    });
  });

  describe('New user (no merchant link)', () => {
    test('should route to /connect-shopify for new users', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockNewUserProfile, error: null })
          })
        })
      });

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockNewUserStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/connect-shopify',
        reason: 'no-merchant-link'
      });
    });
  });

  describe('Master admin users', () => {
    test('should route to /master-admin for master admin users', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMasterAdminProfile, error: null })
          })
        })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/master-admin',
        reason: 'master-admin'
      });

      // Should not call integration validation for master admin
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });
  });

  describe('Uninstalled or invalid token', () => {
    test('should route to /reconnect for uninstalled merchants', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockUninstalledStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/reconnect',
        reason: 'uninstalled-or-invalid-token'
      });
    });

    test('should route to /reconnect for invalid tokens', async () => {
      const invalidTokenStatus = {
        ...mockIntegrationStatus,
        token_valid: false,
        integration_status: 'invalid-token'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: invalidTokenStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/reconnect',
        reason: 'uninstalled-or-invalid-token'
      });
    });

    test('should route to /reconnect for stale tokens', async () => {
      const staleTokenStatus = {
        ...mockIntegrationStatus,
        token_fresh: false,
        integration_status: 'stale-token'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: staleTokenStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/reconnect',
        reason: 'uninstalled-or-invalid-token'
      });
    });
  });

  describe('Error handling', () => {
    test('should route to /error when no profile found', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } })
          })
        })
      });

      const context: LandingContext = {
        userId: 'nonexistent',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/error',
        reason: 'no-profile'
      });
    });

    test('should route to /error on database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockRejectedValue(new Error('Database error'))
          })
        })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/error',
        reason: 'unexpected'
      });
    });

    test('should handle unknown integration status', async () => {
      const unknownStatus = {
        ...mockIntegrationStatus,
        integration_status: 'unknown'
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: unknownStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: false,
        userAgent: 'test-agent'
      };

      const result = await resolveLandingRoute(context);

      expect(result).toEqual({
        route: '/error',
        reason: 'unexpected'
      });
    });
  });

  describe('Context variations', () => {
    test('should handle embedded context with shop domain', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockIntegrationStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1',
        isEmbedded: true,
        shopDomain: 'test-store.myshopify.com',
        userAgent: 'Mozilla/5.0 (embedded)'
      };

      const result = await resolveLandingRoute(context);

      expect(result.route).toBe('/dashboard');
      expect(result.reason).toBe('integrated-active');
    });

    test('should handle missing context gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null })
          })
        })
      });

      mockSupabase.rpc.mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockIntegrationStatus, error: null })
      });

      const context: LandingContext = {
        userId: 'user1'
        // Missing optional fields
      };

      const result = await resolveLandingRoute(context);

      expect(result.route).toBe('/dashboard');
      expect(result.reason).toBe('integrated-active');
    });
  });
});