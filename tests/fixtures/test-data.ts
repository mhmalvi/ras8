/**
 * Test data fixtures for H5 Returns Automation SaaS
 */

export const TEST_MERCHANTS = {
  primary: {
    shopDomain: 'test-store-primary.myshopify.com',
    shopId: 'test-shop-primary',
    host: Buffer.from('test-store-primary.myshopify.com/admin').toString('base64'),
    planType: 'starter'
  },
  secondary: {
    shopDomain: 'test-store-secondary.myshopify.com', 
    shopId: 'test-shop-secondary',
    host: Buffer.from('test-store-secondary.myshopify.com/admin').toString('base64'),
    planType: 'growth'
  },
  testShop: {
    shopDomain: 'test-66666666.myshopify.com',
    shopId: 'test-66666666',
    host: Buffer.from('test-66666666.myshopify.com/admin').toString('base64'),
    planType: 'pro',
    merchantId: 'test-66666666-e29b-41d4-a716-446655440000',
    accessToken: 'shpat_test_66666666_access_token_for_testing',
    // Real merchant data from database
    dbRecord: {
      idx: 1,
      id: '511aabc6-90a8-4fb0-ab57-153dcb240962',
      shop_domain: 'test-66666666.myshopify.com',
      access_token: 'shpat_test_66666666_access_token_for_testing',
      settings: '{}',
      plan_type: 'pro',
      created_at: '2025-09-01 03:39:02.046682+00',
      updated_at: '2025-09-01 03:39:02.046682+00',
      token_encrypted_at: null,
      token_encryption_version: 1
    },
    testUsers: [
      {
        email: 'john.smith@test.com',
        orderId: 'ORD-2024-TEST-001',
        totalAmount: 299.97
      },
      {
        email: 'sarah.johnson@test.com',
        orderId: 'ORD-2024-TEST-002', 
        totalAmount: 549.95
      },
      {
        email: 'mike.chen@test.com',
        orderId: 'ORD-2024-TEST-003',
        totalAmount: 179.97
      },
      {
        email: 'emma.wilson@test.com',
        orderId: 'ORD-2024-TEST-004',
        totalAmount: 129.98
      },
      {
        email: 'david.brown@test.com',
        orderId: 'ORD-2024-TEST-005',
        totalAmount: 699.95
      }
    ]
  }
};

export const MOCK_ORDERS = {
  standard: {
    id: '5123456789',
    orderNumber: '#RAS-5001',
    customerEmail: 'customer@example.com',
    totalPrice: '99.99',
    currency: 'USD',
    lineItems: [
      {
        id: '12345',
        title: 'Premium Widget',
        quantity: 1,
        price: '99.99',
        sku: 'WIDGET-001'
      }
    ],
    createdAt: new Date().toISOString(),
    financialStatus: 'paid',
    fulfillmentStatus: 'fulfilled'
  },
  withMultipleItems: {
    id: '5123456790',
    orderNumber: '#RAS-5002',
    customerEmail: 'customer2@example.com',
    totalPrice: '249.98',
    currency: 'USD',
    lineItems: [
      {
        id: '12346',
        title: 'Premium Widget',
        quantity: 1,
        price: '99.99',
        sku: 'WIDGET-001'
      },
      {
        id: '12347',
        title: 'Deluxe Gadget',
        quantity: 1,
        price: '149.99',
        sku: 'GADGET-001'
      }
    ],
    createdAt: new Date().toISOString(),
    financialStatus: 'paid',
    fulfillmentStatus: 'fulfilled'
  }
};

export const MOCK_RETURNS = {
  pending: {
    id: 'ret_001',
    orderNumber: '#RAS-5001',
    status: 'pending',
    reason: 'defective',
    customerEmail: 'customer@example.com',
    returnItems: [
      {
        lineItemId: '12345',
        quantity: 1,
        reason: 'defective',
        aiSuggestion: 'exchange'
      }
    ],
    createdAt: new Date().toISOString()
  },
  approved: {
    id: 'ret_002',
    orderNumber: '#RAS-5002',
    status: 'approved',
    reason: 'wrong_size',
    customerEmail: 'customer2@example.com',
    returnItems: [
      {
        lineItemId: '12346',
        quantity: 1,
        reason: 'wrong_size',
        aiSuggestion: 'exchange'
      }
    ],
    createdAt: new Date().toISOString()
  }
};

export const TEST_ANALYTICS = {
  metrics: {
    totalReturns: 150,
    totalRefunds: 45000,
    exchangeRate: 0.65,
    avgProcessingTime: 2.5,
    customerSatisfaction: 4.2
  },
  events: [
    {
      type: 'return_created',
      orderId: '5123456789',
      value: 99.99,
      timestamp: new Date().toISOString()
    },
    {
      type: 'exchange_completed',
      orderId: '5123456790',
      value: 149.99,
      timestamp: new Date().toISOString()
    }
  ]
};

export const WEBHOOK_SIGNATURES = {
  valid: 'sha256=example_valid_hmac_signature',
  invalid: 'sha256=invalid_signature'
};

export const OAuth_STATES = {
  valid: 'valid_oauth_state_123456',
  expired: 'expired_oauth_state_789012',
  invalid: 'invalid_oauth_state'
};

export const API_ENDPOINTS = {
  auth: {
    start: '/auth/start',
    callback: '/auth/callback',
    inline: '/auth/inline',
    session: '/functions/v1/get-shopify-config'
  },
  supabase: {
    base: process.env.VITE_SUPABASE_URL || 'https://pvadajelvewdazwmvppk.supabase.co',
    functions: '/functions/v1/'
  },
  functions: {
    dashboardMetrics: '/functions/v1/get-dashboard-metrics',
    shopifyConfig: '/functions/v1/get-shopify-config',
    systemHealth: '/functions/v1/system-health-check',
    shopifyWebhook: '/functions/v1/enhanced-shopify-webhook',
    oauthStart: '/functions/v1/shopify-oauth-start',
    oauthCallback: '/functions/v1/shopify-oauth-callback'
  },
  webhooks: {
    shopify: '/functions/v1/enhanced-shopify-webhook',
    gdpr: '/functions/v1/shopify-gdpr-webhooks'
  }
};

export const ERROR_MESSAGES = {
  auth: {
    invalidShop: 'Invalid shop domain',
    missingParameters: 'Missing required parameters',
    authenticationFailed: 'Authentication failed',
    noValidSession: 'No valid session found'
  },
  returns: {
    notFound: 'Return not found',
    invalidStatus: 'Invalid status transition',
    insufficientPermissions: 'Insufficient permissions'
  }
};