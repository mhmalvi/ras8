import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  total_price: string;
  subtotal_price: string;
  total_tax: string;
  currency: string;
  financial_status: string;
  fulfillment_status: string;
  order_number: number;
  customer: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id?: number;
    name: string;
    quantity: number;
    price: string;
    sku?: string;
    vendor?: string;
    product_title?: string;
    variant_title?: string;
  }>;
  shipping_address?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
  };
  billing_address?: {
    first_name?: string;
    last_name?: string;
    company?: string;
    address1?: string;
    address2?: string;
    city?: string;
    province?: string;
    country?: string;
    zip?: string;
    phone?: string;
  };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SHOPIFY-ORDER-LOOKUP] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { orderNumber, customerEmail, shopDomain } = await req.json();
    
    if (!orderNumber || !customerEmail || !shopDomain) {
      throw new Error("Missing required parameters: orderNumber, customerEmail, shopDomain");
    }

    logStep("Request parameters", { orderNumber, customerEmail, shopDomain });

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Find merchant by shop domain
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, shop_domain, access_token')
      .eq('shop_domain', shopDomain)
      .single();

    if (merchantError || !merchant) {
      throw new Error(`Merchant not found for domain: ${shopDomain}`);
    }

    if (merchant.access_token === 'UNINSTALLED') {
      throw new Error("Merchant has uninstalled the app");
    }

    logStep("Merchant found", { merchantId: merchant.id });

    // Decrypt access token (in production, implement proper decryption)
    const accessToken = merchant.access_token;

    // Call Shopify API to get order details
    const shopifyUrl = `https://${shopDomain}/admin/api/2024-07/orders.json`;
    const queryParams = new URLSearchParams({
      name: orderNumber.toString(),
      email: customerEmail,
      limit: '1',
      fields: 'id,name,email,created_at,updated_at,total_price,subtotal_price,total_tax,currency,financial_status,fulfillment_status,order_number,customer,line_items,shipping_address,billing_address'
    });

    logStep("Calling Shopify API", { url: `${shopifyUrl}?${queryParams}` });

    const shopifyResponse = await fetch(`${shopifyUrl}?${queryParams}`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
        'User-Agent': 'Returns-Automation-SaaS/1.0'
      }
    });

    if (!shopifyResponse.ok) {
      const errorText = await shopifyResponse.text();
      logStep("Shopify API error", { 
        status: shopifyResponse.status, 
        statusText: shopifyResponse.statusText,
        error: errorText 
      });
      throw new Error(`Shopify API error: ${shopifyResponse.status} ${shopifyResponse.statusText}`);
    }

    const shopifyData = await shopifyResponse.json();
    logStep("Shopify API response", { orderCount: shopifyData.orders?.length || 0 });

    if (!shopifyData.orders || shopifyData.orders.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found',
        message: 'No order found matching the provided order number and email'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404
      });
    }

    const order: ShopifyOrder = shopifyData.orders[0];
    
    // Validate that the email matches (case-insensitive)
    if (order.email?.toLowerCase() !== customerEmail.toLowerCase()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email mismatch',
        message: 'Order found but email does not match'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403
      });
    }

    logStep("Order validation successful", { orderId: order.id, orderName: order.name });

    // Store/update order in our database for future reference
    const orderData = {
      shopify_order_id: order.id.toString(),
      merchant_id: merchant.id,
      order_name: order.name,
      customer_email: order.email,
      total_amount: parseFloat(order.total_price),
      currency: order.currency,
      financial_status: order.financial_status,
      fulfillment_status: order.fulfillment_status,
      created_at: order.created_at,
      updated_at: order.updated_at,
      order_data: order // Store full order for reference
    };

    const { data: storedOrder, error: orderError } = await supabase
      .from('orders')
      .upsert(orderData, { 
        onConflict: 'shopify_order_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (orderError) {
      logStep("Error storing order", { error: orderError });
    } else {
      logStep("Order stored successfully", { orderId: storedOrder.id });
    }

    // Log analytics event
    await supabase
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: 'order_lookup_success',
        event_data: {
          shopify_order_id: order.id,
          order_name: order.name,
          customer_email: order.email,
          total_amount: parseFloat(order.total_price),
          lookup_timestamp: new Date().toISOString()
        }
      });

    // Transform order data for frontend
    const orderDetails = {
      id: order.id,
      name: order.name,
      orderNumber: order.order_number,
      email: order.email,
      totalPrice: order.total_price,
      currency: order.currency,
      financialStatus: order.financial_status,
      fulfillmentStatus: order.fulfillment_status,
      createdAt: order.created_at,
      customer: order.customer,
      lineItems: order.line_items.map(item => ({
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        sku: item.sku,
        vendor: item.vendor,
        productTitle: item.product_title,
        variantTitle: item.variant_title
      })),
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address
    };

    logStep("Order lookup completed successfully");

    return new Response(JSON.stringify({
      success: true,
      order: orderDetails,
      message: 'Order found and validated successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep("ERROR in order lookup", { message: errorMessage });
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});