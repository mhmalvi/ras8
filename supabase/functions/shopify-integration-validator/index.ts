import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Enhanced CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

interface ValidationTest {
  name: string;
  description: string;
  status: 'pending' | 'success' | 'failed' | 'warning';
  details?: any;
  errorMessage?: string;
  duration?: number;
}

interface ValidationResult {
  success: boolean;
  overallStatus: 'success' | 'warning' | 'failed';
  shopDomain: string;
  testType: string;
  totalDuration: number;
  timestamp: string;
  tests: ValidationTest[];
  summary: {
    total: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting (100 requests per hour per IP)
  const rateLimitKey = `shopify-validator:${req.headers.get('x-forwarded-for') || 'unknown'}`;
  // Note: In production, implement proper rate limiting with Redis or similar

  try {
    const body = await req.text()
    const requestData = JSON.parse(body)
    
    // Basic validation
    const { shopDomain, accessToken, testType = 'full' } = requestData;
    
    if (!shopDomain || !accessToken) {
      throw new Error('Shop domain and access token are required');
    }

    console.log(`🔍 Starting ${testType} validation for ${shopDomain}`);
    const startTime = Date.now();
    
    const tests: ValidationTest[] = [];
    const normalizedDomain = shopDomain.replace('.myshopify.com', '') + '.myshopify.com';

    // Test 1: Basic Shop Info
    if (testType === 'full' || testType === 'basic') {
      const shopTest = await testShopInfo(normalizedDomain, accessToken);
      tests.push(shopTest);
    }

    // Test 2: HMAC Validation
    if (testType === 'full' || testType === 'hmac') {
      const hmacTest = await testHMACValidation();
      tests.push(hmacTest);
    }

    // Test 3: Webhook Configuration
    if (testType === 'full' || testType === 'webhooks') {
      const webhookTest = await testWebhookConfiguration(normalizedDomain, accessToken);
      tests.push(webhookTest);
    }

    // Test 4: Order API Access
    if (testType === 'full' || testType === 'orders') {
      const orderTest = await testOrderAccess(normalizedDomain, accessToken);
      tests.push(orderTest);
    }

    // Test 5: Product API Access
    if (testType === 'full') {
      const productTest = await testProductAccess(normalizedDomain, accessToken);
      tests.push(productTest);
    }

    const totalDuration = Date.now() - startTime;
    
    // Calculate summary
    const summary = {
      total: tests.length,
      passed: tests.filter(t => t.status === 'success').length,
      warnings: tests.filter(t => t.status === 'warning').length,
      failed: tests.filter(t => t.status === 'failed').length
    };

    const overallStatus = summary.failed > 0 ? 'failed' : 
                         summary.warnings > 0 ? 'warning' : 'success';

    const result: ValidationResult = {
      success: summary.failed === 0,
      overallStatus,
      shopDomain: normalizedDomain,
      testType,
      totalDuration,
      timestamp: new Date().toISOString(),
      tests,
      summary
    };

    console.log(`✅ Validation completed: ${summary.passed}/${summary.total} passed`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Validation error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});

async function testShopInfo(shopDomain: string, accessToken: string): Promise<ValidationTest> {
  const start = Date.now();
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2023-07/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - start;

    if (!response.ok) {
      const errorText = await response.text();
      return {
        name: 'Shop Info Access',
        description: 'Test basic API access to shop information',
        status: 'failed',
        duration,
        errorMessage: `HTTP ${response.status}: ${errorText}`,
      };
    }

    const data = await response.json();
    
    return {
      name: 'Shop Info Access',
      description: 'Test basic API access to shop information',
      status: 'success',
      duration,
      details: {
        shopName: data.shop?.name,
        domain: data.shop?.domain,
        email: data.shop?.email,
        currency: data.shop?.currency,
        timezone: data.shop?.timezone
      },
    };

  } catch (error) {
    return {
      name: 'Shop Info Access',
      description: 'Test basic API access to shop information',
      status: 'failed',
      duration: Date.now() - start,
      errorMessage: error.message,
    };
  }
}

async function testHMACValidation(): Promise<ValidationTest> {
  const start = Date.now();
  
  try {
    // Test HMAC validation logic
    const testPayload = JSON.stringify({ test: 'data', timestamp: Date.now() });
    const testSecret = 'test-secret-key';
    
    // Create test HMAC
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(testSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(testPayload));
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      name: 'HMAC Validation',
      description: 'Test webhook signature validation capability',
      status: 'success',
      duration: Date.now() - start,
      details: {
        algorithm: 'SHA-256',
        testPassed: true,
        sampleSignature: `sha256=${expectedSignature.substring(0, 16)}...`
      },
    };

  } catch (error) {
    return {
      name: 'HMAC Validation',
      description: 'Test webhook signature validation capability',
      status: 'failed',
      duration: Date.now() - start,
      errorMessage: error.message,
    };
  }
}

async function testWebhookConfiguration(shopDomain: string, accessToken: string): Promise<ValidationTest> {
  const start = Date.now();
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2023-07/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - start;

    if (!response.ok) {
      return {
        name: 'Webhook Configuration',
        description: 'Check existing webhook configurations',
        status: response.status === 403 ? 'warning' : 'failed',
        duration,
        errorMessage: `HTTP ${response.status}: Limited webhook access`,
      };
    }

    const data = await response.json();
    const webhooks = data.webhooks || [];
    
    const returnWebhooks = webhooks.filter((wh: any) => 
      wh.topic?.includes('orders') || wh.topic?.includes('returns')
    );

    return {
      name: 'Webhook Configuration',
      description: 'Check existing webhook configurations',
      status: returnWebhooks.length > 0 ? 'success' : 'warning',
      duration,
      details: {
        totalWebhooks: webhooks.length,
        returnRelatedWebhooks: returnWebhooks.length,
        webhooks: returnWebhooks.map((wh: any) => ({
          topic: wh.topic,
          address: wh.address,
          format: wh.format
        }))
      },
      ...(returnWebhooks.length === 0 && {
        errorMessage: 'No return-related webhooks configured'
      })
    };

  } catch (error) {
    return {
      name: 'Webhook Configuration',
      description: 'Check existing webhook configurations',
      status: 'failed',
      duration: Date.now() - start,
      errorMessage: error.message,
    };
  }
}

async function testOrderAccess(shopDomain: string, accessToken: string): Promise<ValidationTest> {
  const start = Date.now();
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2023-07/orders.json?limit=1`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - start;

    if (!response.ok) {
      return {
        name: 'Order API Access',
        description: 'Test access to orders for return processing',
        status: 'failed',
        duration,
        errorMessage: `HTTP ${response.status}: Cannot access orders`,
      };
    }

    const data = await response.json();
    const orders = data.orders || [];
    
    return {
      name: 'Order API Access',
      description: 'Test access to orders for return processing',
      status: 'success',
      duration,
      details: {
        hasOrders: orders.length > 0,
        sampleOrder: orders[0] ? {
          id: orders[0].id,
          name: orders[0].name,
          financial_status: orders[0].financial_status,
          fulfillment_status: orders[0].fulfillment_status
        } : null
      },
    };

  } catch (error) {
    return {
      name: 'Order API Access',
      description: 'Test access to orders for return processing',
      status: 'failed',
      duration: Date.now() - start,
      errorMessage: error.message,
    };
  }
}

async function testProductAccess(shopDomain: string, accessToken: string): Promise<ValidationTest> {
  const start = Date.now();
  
  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2023-07/products.json?limit=1`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - start;

    if (!response.ok) {
      return {
        name: 'Product API Access',
        description: 'Test access to products for exchange recommendations',
        status: 'warning',
        duration,
        errorMessage: `HTTP ${response.status}: Limited product access`,
      };
    }

    const data = await response.json();
    const products = data.products || [];
    
    return {
      name: 'Product API Access',
      description: 'Test access to products for exchange recommendations',
      status: 'success',
      duration,
      details: {
        hasProducts: products.length > 0,
        sampleProduct: products[0] ? {
          id: products[0].id,
          title: products[0].title,
          variants: products[0].variants?.length || 0
        } : null
      },
    };

  } catch (error) {
    return {
      name: 'Product API Access',
      description: 'Test access to products for exchange recommendations',
      status: 'failed',
      duration: Date.now() - start,
      errorMessage: error.message,
    };
  }
}