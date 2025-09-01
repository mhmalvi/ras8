import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    console.log('Setting up test data for test-66666666.myshopify.com...')

    // Insert test merchant
    const merchantData = {
      id: 'test-66666666-e29b-41d4-a716-446655440000',
      shop_domain: 'test-66666666.myshopify.com',
      access_token: 'test_access_token_66666666',
      plan_type: 'pro'
    }

    const { error: merchantError } = await supabaseClient
      .from('merchants')
      .upsert([merchantData], { onConflict: 'shop_domain' })

    if (merchantError) {
      console.error('Error inserting merchant:', merchantError)
      throw merchantError
    }

    // Test orders data
    const testOrders = [
      {
        id: 'test1-8400-e29b-41d4-a716-446655440000',
        shopify_order_id: 'ORD-2024-TEST-001',
        customer_email: 'john.smith@test.com',
        total_amount: 299.97,
        status: 'completed',
        merchant_id: 'test-66666666-e29b-41d4-a716-446655440000'
      },
      {
        id: 'test2-8400-e29b-41d4-a716-446655440000',
        shopify_order_id: 'ORD-2024-TEST-002',
        customer_email: 'sarah.johnson@test.com',
        total_amount: 549.95,
        status: 'completed',
        merchant_id: 'test-66666666-e29b-41d4-a716-446655440000'
      },
      {
        id: 'test3-8400-e29b-41d4-a716-446655440000',
        shopify_order_id: 'ORD-2024-TEST-003',
        customer_email: 'mike.chen@test.com',
        total_amount: 179.97,
        status: 'completed',
        merchant_id: 'test-66666666-e29b-41d4-a716-446655440000'
      },
      {
        id: 'test4-8400-e29b-41d4-a716-446655440000',
        shopify_order_id: 'ORD-2024-TEST-004',
        customer_email: 'emma.wilson@test.com',
        total_amount: 129.98,
        status: 'completed',
        merchant_id: 'test-66666666-e29b-41d4-a716-446655440000'
      },
      {
        id: 'test5-8400-e29b-41d4-a716-446655440000',
        shopify_order_id: 'ORD-2024-TEST-005',
        customer_email: 'david.brown@test.com',
        total_amount: 699.95,
        status: 'completed',
        merchant_id: 'test-66666666-e29b-41d4-a716-446655440000'
      }
    ]

    // Insert orders
    const { error: ordersError } = await supabaseClient
      .from('orders')
      .upsert(testOrders, { onConflict: 'shopify_order_id' })

    if (ordersError) {
      console.error('Error inserting orders:', ordersError)
      throw ordersError
    }

    // Order items data
    const orderItems = [
      // John's order items
      { order_id: 'test1-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_001', product_name: 'Gaming Headset Pro', price: 149.99, quantity: 1 },
      { order_id: 'test1-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_002', product_name: 'Mechanical Keyboard', price: 89.99, quantity: 1 },
      { order_id: 'test1-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_003', product_name: 'Gaming Mouse', price: 59.99, quantity: 1 },
      
      // Sarah's order items
      { order_id: 'test2-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_004', product_name: 'MacBook Pro Case Premium', price: 129.99, quantity: 1 },
      { order_id: 'test2-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_005', product_name: 'Wireless Charging Station', price: 199.99, quantity: 1 },
      { order_id: 'test2-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_006', product_name: 'USB-C Hub Deluxe', price: 119.99, quantity: 1 },
      { order_id: 'test2-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_007', product_name: 'Laptop Stand Ergonomic', price: 99.98, quantity: 1 },
      
      // Mike's order items
      { order_id: 'test3-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_008', product_name: 'Bluetooth Speaker', price: 79.99, quantity: 1 },
      { order_id: 'test3-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_009', product_name: 'Phone Case Premium', price: 49.99, quantity: 1 },
      { order_id: 'test3-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_010', product_name: 'Screen Protector Pack', price: 49.99, quantity: 1 },
      
      // Emma's order items
      { order_id: 'test4-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_011', product_name: 'Wireless Earbuds', price: 89.99, quantity: 1 },
      { order_id: 'test4-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_012', product_name: 'Car Mount Universal', price: 39.99, quantity: 1 },
      
      // David's order items
      { order_id: 'test5-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_013', product_name: 'Monitor 4K Professional', price: 299.99, quantity: 1 },
      { order_id: 'test5-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_014', product_name: 'Webcam HD Pro', price: 159.99, quantity: 1 },
      { order_id: 'test5-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_015', product_name: 'Desk Lamp LED', price: 129.99, quantity: 1 },
      { order_id: 'test5-8400-e29b-41d4-a716-446655440000', product_id: 'prod_test_016', product_name: 'Cable Management Kit', price: 109.98, quantity: 1 }
    ]

    // Insert order items
    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .upsert(orderItems)

    if (itemsError) {
      console.error('Error inserting order items:', itemsError)
      throw itemsError
    }

    // Add sample returns
    const testReturns = [
      {
        id: 'testret1-e29b-41d4-a716-446655440000',
        shopify_order_id: 'ORD-2024-TEST-001',
        customer_email: 'john.smith@test.com',
        reason: 'Product defective',
        status: 'requested',
        total_amount: 149.99,
        merchant_id: 'test-66666666-e29b-41d4-a716-446655440000'
      },
      {
        id: 'testret2-e29b-41d4-a716-446655440000',
        shopify_order_id: 'ORD-2024-TEST-002',
        customer_email: 'sarah.johnson@test.com',
        reason: 'Wrong size',
        status: 'approved',
        total_amount: 129.99,
        merchant_id: 'test-66666666-e29b-41d4-a716-446655440000'
      }
    ]

    const { error: returnsError } = await supabaseClient
      .from('returns')
      .upsert(testReturns)

    if (returnsError) {
      console.error('Error inserting returns:', returnsError)
      throw returnsError
    }

    console.log('✅ Test data setup complete!')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test data for test-66666666.myshopify.com has been successfully set up!',
        shopDomain: 'test-66666666.myshopify.com',
        testUsers: [
          'john.smith@test.com',
          'sarah.johnson@test.com', 
          'mike.chen@test.com',
          'emma.wilson@test.com',
          'david.brown@test.com'
        ],
        installUrl: 'https://ras-8.vercel.app/install?shop=test-66666666.myshopify.com'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in setup-test-data function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})