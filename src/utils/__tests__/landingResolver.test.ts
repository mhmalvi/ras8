import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resolveLandingRoute } from '../landingResolver';
import { supabase } from '@/integrations/supabase/client';

describe('landingResolver', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('resolveLandingRoute', () => {
    it('should redirect to dashboard for embedded app with shop param', async () => {
      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: 'test-store.myshopify.com',
        isEmbedded: true,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/dashboard');
      expect(result.reason).toBe('embedded_with_shop');
    });

    it('should redirect to error if no user role (missing profile)', async () => {
      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: null,
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/error');
      expect(result.reason).toBe('no_profile');
    });

    it('should redirect to master-admin for master_admin role', async () => {
      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'master_admin',
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/master-admin');
      expect(result.reason).toBe('master_admin_role');
    });

    it('should redirect to connect-shopify for no merchant link', async () => {
      // Mock database response for no merchant link
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{
          has_merchant_link: false,
          merchant_status: null,
          token_valid: null,
          token_fresh: null,
          integration_status: 'no-merchant-link',
        }],
        error: null,
      });

      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/connect-shopify');
      expect(result.reason).toBe('no-merchant-link');
    });

    it('should redirect to reconnect for uninstalled merchant', async () => {
      // Mock database response for uninstalled merchant
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{
          has_merchant_link: true,
          merchant_status: 'uninstalled',
          token_valid: false,
          token_fresh: false,
          integration_status: 'uninstalled',
        }],
        error: null,
      });

      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/reconnect');
      expect(result.reason).toBe('uninstalled');
    });

    it('should redirect to reconnect for invalid token', async () => {
      // Mock database response for invalid token
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{
          has_merchant_link: true,
          merchant_status: 'active',
          token_valid: false,
          token_fresh: false,
          integration_status: 'invalid-token',
        }],
        error: null,
      });

      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/reconnect');
      expect(result.reason).toBe('invalid-token');
    });

    it('should allow stale token for embedded apps (auto-refresh)', async () => {
      // Mock database response for stale token
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{
          has_merchant_link: true,
          merchant_status: 'active',
          token_valid: true,
          token_fresh: false,
          integration_status: 'stale-token',
        }],
        error: null,
      });

      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: 'test-store.myshopify.com',
        isEmbedded: true,
      });

      // Embedded apps should still go to dashboard (App Bridge handles refresh)
      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/dashboard');
    });

    it('should redirect standalone users to reconnect for stale token', async () => {
      // Mock database response for stale token
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{
          has_merchant_link: true,
          merchant_status: 'active',
          token_valid: true,
          token_fresh: false,
          integration_status: 'stale-token',
        }],
        error: null,
      });

      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/reconnect');
      expect(result.reason).toBe('stale-token');
    });

    it('should allow integrated-active users to dashboard', async () => {
      // Mock database response for fully integrated merchant
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: [{
          has_merchant_link: true,
          merchant_status: 'active',
          token_valid: true,
          token_fresh: true,
          integration_status: 'integrated-active',
        }],
        error: null,
      });

      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: null,
        isEmbedded: false,
      });

      expect(result.shouldRedirect).toBe(true);
      expect(result.redirectTo).toBe('/dashboard');
      expect(result.reason).toBe('integrated-active');
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: new Error('Database connection failed'),
      });

      const result = await resolveLandingRoute({
        userId: 'test-user-id',
        userRole: 'user',
        shopDomain: null,
        isEmbedded: false,
      });

      // Should have fallback behavior
      expect(result.shouldRedirect).toBe(true);
      // Fallback should still work
      expect(result.redirectTo).toBeDefined();
    });
  });
});
