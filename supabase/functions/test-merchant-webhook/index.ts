
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { merchantId, webhookUrl, testPayload } = await req.json()
    
    console.log(`🧪 Testing webhook for merchant: ${merchantId}`)
    console.log(`🌐 Webhook URL: ${webhookUrl}`)

    if (!merchantId || !webhookUrl) {
      throw new Error('Missing required parameters: merchantId and webhookUrl')
    }

    // Create comprehensive test payload
    const defaultTestPayload = {
      event: "webhook_test",
      version: "2.0",
      timestamp: new Date().toISOString(),
      source: "returns_automation_saas",
      merchantId: merchantId,
      tenantIsolated: true,
      
      // Test data for order webhook
      orderDetails: {
        id: "test-order-123",
        order_number: "#TEST1001",
        email: "test.customer@example.com",
        total_price: "149.99",
        currency: "USD",
        status: "paid",
        financial_status: "paid",
        fulfillment_status: "unfulfilled",
        created_at: new Date().toISOString(),
        tags: "test, webhook-validation"
      },
      
      // Test data for customer
      customerDetails: {
        id: "test-customer-456",
        email: "test.customer@example.com",
        first_name: "John",
        last_name: "Doe",
        phone: "+1-555-0123",
        accepts_marketing: true
      },
      
      // Test data for line items
      itemDetails: [
        {
          id: "test-item-789",
          product_id: "test-product-101",
          variant_id: "test-variant-202",
          name: "Test Product - Blue Medium",
          quantity: 2,
          price: "74.99",
          sku: "TEST-BLUE-M"
        }
      ],
      
      // Test data for returns
      returnDetails: {
        id: "test-return-321",
        order_id: "test-order-123",
        status: "requested",
        reason: "Item doesn't fit as expected",
        refund_amount: "149.99",
        created_at: new Date().toISOString()
      },
      
      metadata: {
        webhook_id: `test_${Date.now()}`,
        source_topic: "webhook_test",
        merchant_id: merchantId,
        tenant_isolated: true,
        comprehensive: true,
        test_mode: true,
        server_side_test: true
      }
    }

    const finalPayload = testPayload || defaultTestPayload

    console.log(`📤 Sending POST request to: ${webhookUrl}`)
    
    // Make the webhook request with proper headers
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Source': 'returns-automation-saas',
        'X-Webhook-Version': '2.0',
        'X-Merchant-ID': merchantId,
        'X-Tenant-ID': merchantId,
        'X-Tenant-Isolated': 'true',
        'User-Agent': 'Returns-Automation-SaaS/2.0'
      },
      body: JSON.stringify(finalPayload)
    })

    const responseText = await webhookResponse.text()
    let responseData
    
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw: responseText }
    }

    const result = {
      success: webhookResponse.ok,
      status: webhookResponse.status,
      statusText: webhookResponse.statusText,
      headers: Object.fromEntries(webhookResponse.headers.entries()),
      data: responseData,
      url: webhookUrl,
      merchantId: merchantId,
      timestamp: new Date().toISOString(),
      testType: 'server_side',
      payloadSize: JSON.stringify(finalPayload).length
    }

    if (!webhookResponse.ok) {
      console.error(`❌ Webhook test failed: ${webhookResponse.status} ${webhookResponse.statusText}`)
      result.error = `HTTP ${webhookResponse.status}: ${webhookResponse.statusText}`
    } else {
      console.log(`✅ Webhook test successful: ${webhookResponse.status}`)
    }

    // Log the test result to analytics_events table
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    await supabase.from('analytics_events').insert({
      event_type: 'webhook_test_server_side',
      merchant_id: merchantId,
      event_data: {
        webhook_url: webhookUrl,
        success: result.success,
        status: result.status,
        response_data: result.data,
        error: result.error,
        test_type: 'server_side',
        payload_size: result.payloadSize,
        timestamp: result.timestamp
      }
    })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    console.error('💥 Webhook test error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      testType: 'server_side'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
