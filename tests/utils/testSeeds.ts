/**
 * Test Data Seeding Utilities
 * 
 * Provides utilities for seeding test data for landing logic tests
 */

export interface TestUser {
  id: string;
  email: string;
  created_at?: string;
}

export interface TestProfile {
  id: string;
  merchant_id?: string | null;
  email: string;
  role: 'admin' | 'master_admin' | 'user';
  first_name?: string;
  last_name?: string;
  created_at?: string;
}

export interface TestMerchant {
  id: string;
  shop_domain: string;
  shop_id?: number;
  status: 'active' | 'uninstalled' | 'pending' | 'suspended';
  installed_at?: string;
  uninstalled_at?: string;
  plan_type?: string;
  settings?: Record<string, any>;
  created_at?: string;
}

export interface TestShopifyToken {
  id?: string;
  merchant_id: string;
  access_token: string;
  scopes?: string[];
  is_valid: boolean;
  last_verified_at?: string;
  expires_at?: string;
  created_at?: string;
}

export interface TestAnalyticsEvent {
  id?: string;
  merchant_id: string;
  event_type: string;
  event_data: Record<string, any>;
  created_at?: string;
}

export interface TestSeedData {
  users?: TestUser[];
  profiles?: TestProfile[];
  merchants?: TestMerchant[];
  shopify_tokens?: TestShopifyToken[];
  analytics_events?: TestAnalyticsEvent[];
}

/**
 * Create a complete test scenario for landing logic testing
 */
export class TestScenarioBuilder {
  private data: TestSeedData = {};

  /**
   * Add a new user (no merchant integration)
   */
  newUser(userId: string, email: string): this {
    this.addUser(userId, email);
    this.addProfile(userId, {
      merchant_id: null,
      email,
      role: 'admin'
    });
    return this;
  }

  /**
   * Add a returning integrated user
   */
  integratedUser(
    userId: string, 
    email: string, 
    shopDomain: string,
    options: {
      tokenValid?: boolean;
      tokenFresh?: boolean;
      merchantStatus?: TestMerchant['status'];
    } = {}
  ): this {
    const merchantId = `merchant_${userId}`;
    const tokenId = `token_${userId}`;

    this.addUser(userId, email);
    this.addMerchant(merchantId, {
      shop_domain: shopDomain,
      status: options.merchantStatus || 'active',
      installed_at: new Date().toISOString()
    });
    this.addProfile(userId, {
      merchant_id: merchantId,
      email,
      role: 'admin'
    });
    this.addShopifyToken(tokenId, {
      merchant_id: merchantId,
      access_token: `encrypted_token_${userId}`,
      is_valid: options.tokenValid !== false,
      last_verified_at: options.tokenFresh !== false 
        ? new Date().toISOString()
        : new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    });

    return this;
  }

  /**
   * Add an uninstalled user (needs reconnect)
   */
  uninstalledUser(userId: string, email: string, shopDomain: string): this {
    const merchantId = `merchant_${userId}`;
    const tokenId = `token_${userId}`;

    this.addUser(userId, email);
    this.addMerchant(merchantId, {
      shop_domain: shopDomain,
      status: 'uninstalled',
      installed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      uninstalled_at: new Date().toISOString()
    });
    this.addProfile(userId, {
      merchant_id: merchantId,
      email,
      role: 'admin'
    });
    this.addShopifyToken(tokenId, {
      merchant_id: merchantId,
      access_token: `old_token_${userId}`,
      is_valid: false,
      last_verified_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    });

    return this;
  }

  /**
   * Add a master admin user
   */
  masterAdmin(userId: string, email: string): this {
    this.addUser(userId, email);
    this.addProfile(userId, {
      merchant_id: null,
      email,
      role: 'master_admin'
    });
    return this;
  }

  /**
   * Add individual entities
   */
  addUser(id: string, email: string, data: Partial<TestUser> = {}): this {
    if (!this.data.users) this.data.users = [];
    this.data.users.push({
      id,
      email,
      created_at: new Date().toISOString(),
      ...data
    });
    return this;
  }

  addProfile(id: string, data: Partial<TestProfile> & { email: string, role: string }): this {
    if (!this.data.profiles) this.data.profiles = [];
    this.data.profiles.push({
      id,
      created_at: new Date().toISOString(),
      ...data
    });
    return this;
  }

  addMerchant(id: string, data: Partial<TestMerchant> & { shop_domain: string }): this {
    if (!this.data.merchants) this.data.merchants = [];
    this.data.merchants.push({
      id,
      status: 'active',
      plan_type: 'starter',
      created_at: new Date().toISOString(),
      ...data
    });
    return this;
  }

  addShopifyToken(id: string, data: Partial<TestShopifyToken> & { merchant_id: string }): this {
    if (!this.data.shopify_tokens) this.data.shopify_tokens = [];
    this.data.shopify_tokens.push({
      id,
      access_token: 'encrypted_test_token',
      scopes: ['read_orders', 'write_orders', 'read_customers', 'read_products'],
      is_valid: true,
      last_verified_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      ...data
    });
    return this;
  }

  addAnalyticsEvent(merchantId: string, eventType: string, eventData: Record<string, any>): this {
    if (!this.data.analytics_events) this.data.analytics_events = [];
    this.data.analytics_events.push({
      id: `event_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      merchant_id: merchantId,
      event_type: eventType,
      event_data: eventData,
      created_at: new Date().toISOString()
    });
    return this;
  }

  /**
   * Build and return the seed data
   */
  build(): TestSeedData {
    return { ...this.data };
  }

  /**
   * Build and return as JSON string for easy storage
   */
  buildJson(): string {
    return JSON.stringify(this.build(), null, 2);
  }
}

/**
 * Pre-built test scenarios for common use cases
 */
export const TestScenarios = {
  /**
   * New user with no merchant integration
   */
  newUser: (userId: string = 'user1', email: string = 'newuser@example.com') =>
    new TestScenarioBuilder().newUser(userId, email).build(),

  /**
   * Returning user with active integration
   */
  integratedUser: (
    userId: string = 'user1', 
    email: string = 'integrated@example.com',
    shopDomain: string = 'test-store.myshopify.com'
  ) =>
    new TestScenarioBuilder().integratedUser(userId, email, shopDomain).build(),

  /**
   * User with uninstalled app
   */
  uninstalledUser: (
    userId: string = 'user1',
    email: string = 'uninstalled@example.com', 
    shopDomain: string = 'uninstalled-store.myshopify.com'
  ) =>
    new TestScenarioBuilder().uninstalledUser(userId, email, shopDomain).build(),

  /**
   * Master admin user
   */
  masterAdmin: (userId: string = 'admin1', email: string = 'admin@example.com') =>
    new TestScenarioBuilder().masterAdmin(userId, email).build(),

  /**
   * User with expired token (needs reconnect)
   */
  expiredToken: (
    userId: string = 'user1',
    email: string = 'expired@example.com',
    shopDomain: string = 'expired-store.myshopify.com'
  ) =>
    new TestScenarioBuilder()
      .integratedUser(userId, email, shopDomain, { 
        tokenValid: false,
        tokenFresh: false 
      })
      .build(),

  /**
   * Multiple users with different states
   */
  multipleUsers: () =>
    new TestScenarioBuilder()
      .newUser('new_user', 'new@example.com')
      .integratedUser('integrated_user', 'integrated@example.com', 'integrated.myshopify.com')
      .uninstalledUser('uninstalled_user', 'uninstalled@example.com', 'uninstalled.myshopify.com')
      .masterAdmin('admin_user', 'admin@example.com')
      .build()
};

/**
 * Database seeding utilities for tests
 */
export class TestDatabaseSeeder {
  /**
   * Seed test data into the database
   */
  static async seed(data: TestSeedData): Promise<void> {
    // In a real implementation, this would use the database client
    // For now, we'll use localStorage as a mock
    if (typeof window !== 'undefined') {
      localStorage.setItem('test_seed_data', JSON.stringify(data));
      localStorage.setItem('test_seed_timestamp', Date.now().toString());
    }
  }

  /**
   * Clear all test data
   */
  static async clear(): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('test_seed_data');
      localStorage.removeItem('test_seed_timestamp');
    }
  }

  /**
   * Get seeded test data
   */
  static getSeededData(): TestSeedData | null {
    if (typeof window !== 'undefined') {
      const data = localStorage.getItem('test_seed_data');
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  /**
   * Verify test data was seeded correctly
   */
  static async verify(expectedData: TestSeedData): Promise<boolean> {
    const seededData = this.getSeededData();
    
    if (!seededData) return false;

    // Basic verification - in a real implementation, this would be more thorough
    const keys = ['users', 'profiles', 'merchants', 'shopify_tokens'] as const;
    
    for (const key of keys) {
      if (expectedData[key] && seededData[key]) {
        if (expectedData[key]!.length !== seededData[key]!.length) {
          return false;
        }
      }
    }

    return true;
  }
}

/**
 * Mock Supabase responses based on seeded data
 */
export class MockSupabaseResponses {
  static mockProfileResponse(userId: string): any {
    const data = TestDatabaseSeeder.getSeededData();
    const profile = data?.profiles?.find(p => p.id === userId);
    
    return {
      data: profile || null,
      error: profile ? null : { code: 'PGRST116', message: 'No rows found' }
    };
  }

  static mockIntegrationValidationResponse(userId: string): any {
    const data = TestDatabaseSeeder.getSeededData();
    const profile = data?.profiles?.find(p => p.id === userId);
    
    if (!profile) {
      return {
        data: {
          has_merchant_link: false,
          merchant_status: null,
          token_valid: null,
          token_fresh: null,
          integration_status: 'no-merchant-link'
        },
        error: null
      };
    }

    const merchant = profile.merchant_id 
      ? data?.merchants?.find(m => m.id === profile.merchant_id)
      : null;
    
    const token = merchant
      ? data?.shopify_tokens?.find(t => t.merchant_id === merchant.id)
      : null;

    let integrationStatus = 'unknown';
    
    if (!profile.merchant_id) {
      integrationStatus = 'no-merchant-link';
    } else if (merchant?.status === 'uninstalled') {
      integrationStatus = 'uninstalled';
    } else if (merchant?.status !== 'active') {
      integrationStatus = 'inactive';
    } else if (!token?.is_valid) {
      integrationStatus = 'invalid-token';
    } else if (token.last_verified_at) {
      const lastVerified = new Date(token.last_verified_at).getTime();
      const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
      if (lastVerified < dayAgo) {
        integrationStatus = 'stale-token';
      } else {
        integrationStatus = 'integrated-active';
      }
    }

    return {
      data: {
        has_merchant_link: !!profile.merchant_id,
        merchant_status: merchant?.status || null,
        token_valid: token?.is_valid || null,
        token_fresh: token ? new Date(token.last_verified_at || 0) > new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
        integration_status: integrationStatus
      },
      error: null
    };
  }
}