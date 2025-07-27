import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ValidationTest {
  name: string;
  description: string;
  status: 'pending' | 'success' | 'failed' | 'warning';
  details?: any;
  errorMessage?: string;
  duration?: number;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SHOPIFY-VALIDATOR] ${step}${detailsStr}`);
};

async function validateHMACSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
  
  return signature === expectedSignature;
}

async function testWebhookEndpoint(shopDomain: string, accessToken: string): Promise<ValidationTest> {
  const test: ValidationTest = {
    name: 'Webhook Endpoint',
    description: 'Test webhook endpoint availability and response',
    status: 'pending'
  };

  try {
    const startTime = Date.now();
    
    // Test our webhook endpoint
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enhanced-shopify-webhook`;
    
    const testPayload = {
      id: 12345,
      name: '#TEST1001',
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      total_price: '99.99',
      line_items: []
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Topic': 'orders/create',
        'X-Shopify-Shop-Domain': shopDomain,
        'X-Shopify-HMAC-SHA256': 'test-signature',
        'X-Shopify-Timestamp': Math.floor(Date.now() / 1000).toString()
      },
      body: JSON.stringify(testPayload)
    });

    test.duration = Date.now() - startTime;
    
    if (response.status === 401) {
      test.status = 'success';
      test.details = { message: 'Webhook endpoint properly validates HMAC signatures' };
    } else if (response.ok) {
      test.status = 'warning';
      test.details = { message: 'Webhook endpoint responds but may not validate signatures properly' };
    } else {
      test.status = 'failed';
      test.errorMessage = `Webhook endpoint returned ${response.status}`;
    }

  } catch (error) {
    test.status = 'failed';
    test.errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  return test;
}

async function testShopifyAPIConnection(shopDomain: string, accessToken: string): Promise<ValidationTest> {
  const test: ValidationTest = {
    name: 'Shopify API Connection',
    description: 'Test connection to Shopify Admin API',
    status: 'pending'
  };

  try {
    const startTime = Date.now();
    
    const response = await fetch(`https://${shopDomain}/admin/api/2024-07/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    test.duration = Date.now() - startTime;

    if (response.ok) {
      const shopData = await response.json();
      test.status = 'success';
      test.details = {
        shopName: shopData.shop?.name,
        domain: shopData.shop?.domain,
        email: shopData.shop?.email,
        currency: shopData.shop?.currency
      };
    } else {
      test.status = 'failed';
      test.errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    }

  } catch (error) {
    test.status = 'failed';
    test.errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  return test;
}

async function testOrderSynchronization(shopDomain: string, accessToken: string): Promise<ValidationTest> {
  const test: ValidationTest = {
    name: 'Order Synchronization',
    description: 'Test order retrieval and data synchronization',
    status: 'pending'
  };

  try {
    const startTime = Date.now();
    
    const response = await fetch(`https://${shopDomain}/admin/api/2024-07/orders.json?limit=5&status=any`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    test.duration = Date.now() - startTime;

    if (response.ok) {
      const ordersData = await response.json();
      test.status = 'success';
      test.details = {
        orderCount: ordersData.orders?.length || 0,
        sampleOrderIds: ordersData.orders?.slice(0, 3).map((o: any) => o.id) || [],
        apiVersion: '2024-07'
      };
    } else {
      test.status = 'failed';
      test.errorMessage = `Orders API request failed: ${response.status} ${response.statusText}`;
    }

  } catch (error) {
    test.status = 'failed';
    test.errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  return test;
}

async function testWebhookConfiguration(shopDomain: string, accessToken: string): Promise<ValidationTest> {
  const test: ValidationTest = {
    name: 'Webhook Configuration',
    description: 'Check configured webhooks in Shopify',
    status: 'pending'
  };

  try {
    const startTime = Date.now();
    
    const response = await fetch(`https://${shopDomain}/admin/api/2024-07/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    test.duration = Date.now() - startTime;

    if (response.ok) {
      const webhooksData = await response.json();
      const webhooks = webhooksData.webhooks || [];
      
      const relevantWebhooks = webhooks.filter((w: any) => 
        w.address?.includes('supabase.co') && (
          w.topic === 'orders/create' || 
          w.topic === 'orders/updated' || 
          w.topic === 'app/uninstalled'
        )
      );

      test.status = relevantWebhooks.length > 0 ? 'success' : 'warning';
      test.details = {
        totalWebhooks: webhooks.length,
        relevantWebhooks: relevantWebhooks.length,
        configuredTopics: relevantWebhooks.map((w: any) => w.topic),
        webhookAddresses: relevantWebhooks.map((w: any) => w.address)
      };

      if (relevantWebhooks.length === 0) {
        test.errorMessage = 'No webhooks configured for this app';
      }

    } else {
      test.status = 'failed';
      test.errorMessage = `Webhooks API request failed: ${response.status} ${response.statusText}`;
    }

  } catch (error) {
    test.status = 'failed';
    test.errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  return test;
}

async function testHMACValidation(): Promise<ValidationTest> {
  const test: ValidationTest = {
    name: 'HMAC Signature Validation',
    description: 'Test HMAC signature generation and verification',
    status: 'pending'
  };

  try {
    const startTime = Date.now();
    
    const testPayload = '{"test": "data", "timestamp": "' + new Date().toISOString() + '"}';
    const testSecret = 'test-webhook-secret-key';
    
    // Generate signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(testSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(testPayload));
    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    
    // Verify signature
    const isValid = await validateHMACSignature(testPayload, signature, testSecret);
    
    test.duration = Date.now() - startTime;
    
    if (isValid) {
      test.status = 'success';
      test.details = { 
        message: 'HMAC signature generation and verification working correctly',
        testPayloadLength: testPayload.length,
        signatureLength: signature.length
      };
    } else {
      test.status = 'failed';
      test.errorMessage = 'HMAC signature verification failed';
    }

  } catch (error) {
    test.status = 'failed';
    test.errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }

  return test;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { shopDomain, accessToken, testType = 'full' } = await req.json();
    
    if (!shopDomain || !accessToken) {
      throw new Error("Missing required parameters: shopDomain and accessToken");
    }

    logStep("Request parameters", { shopDomain, testType });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('shop_domain', shopDomain)
      .single();

    if (merchantError || !merchant) {
      throw new Error(`Merchant not found for domain: ${shopDomain}`);
    }

    logStep("Merchant found", { merchantId: merchant.id });

    const validationTests: ValidationTest[] = [];
    const startTime = Date.now();

    // Run validation tests based on testType
    if (testType === 'full' || testType === 'hmac') {
      validationTests.push(await testHMACValidation());
    }

    if (testType === 'full' || testType === 'api') {
      validationTests.push(await testShopifyAPIConnection(shopDomain, accessToken));
    }

    if (testType === 'full' || testType === 'orders') {
      validationTests.push(await testOrderSynchronization(shopDomain, accessToken));
    }

    if (testType === 'full' || testType === 'webhooks') {
      validationTests.push(await testWebhookConfiguration(shopDomain, accessToken));
      validationTests.push(await testWebhookEndpoint(shopDomain, accessToken));
    }

    const totalDuration = Date.now() - startTime;

    // Calculate overall status
    const hasFailures = validationTests.some(test => test.status === 'failed');
    const hasWarnings = validationTests.some(test => test.status === 'warning');
    
    let overallStatus: 'success' | 'warning' | 'failed';
    if (hasFailures) {
      overallStatus = 'failed';
    } else if (hasWarnings) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'success';
    }

    const validationResult = {
      success: overallStatus !== 'failed',
      overallStatus,
      shopDomain,
      testType,
      totalDuration,
      timestamp: new Date().toISOString(),
      tests: validationTests,
      summary: {
        total: validationTests.length,
        passed: validationTests.filter(t => t.status === 'success').length,
        warnings: validationTests.filter(t => t.status === 'warning').length,
        failed: validationTests.filter(t => t.status === 'failed').length
      }
    };

    // Log validation result
    await supabase
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: 'shopify_integration_validation',
        event_data: {
          shop_domain: shopDomain,
          test_type: testType,
          overall_status: overallStatus,
          total_duration: totalDuration,
          tests_summary: validationResult.summary,
          validation_timestamp: new Date().toISOString()
        }
      });

    logStep("Validation completed", { 
      overallStatus, 
      totalTests: validationTests.length,
      duration: totalDuration
    });

    return new Response(JSON.stringify(validationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep("ERROR in validation", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});