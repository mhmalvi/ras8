import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface OrderLookupRequest {
  orderNumber: string;
  customerEmail: string;
}

interface OrderLookupResponse {
  success: boolean;
  order?: any;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderNumber, customerEmail }: OrderLookupRequest = await req.json();

    if (!orderNumber || !customerEmail) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order number and email are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get merchant information with optimized query
    const merchantData = await getMerchantForOrderLookup();
    if (!merchantData) {
      return new Response(
        JSON.stringify({ success: false, error: 'No active merchants found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Lookup order from Shopify with optimized API calls
    const orderData = await lookupOrderFromShopify(
      merchantData.shop_domain,
      merchantData.access_token,
      orderNumber,
      customerEmail
    );

    if (!orderData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Add merchant information to order data
    const enhancedOrder = {
      ...orderData,
      merchant_id: merchantData.id,
      shop_domain: merchantData.shop_domain
    };

    return new Response(
      JSON.stringify({ success: true, order: enhancedOrder }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Order lookup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function getMerchantForOrderLookup() {
  try {
    // For now, get the first active merchant
    // In production, you might want to implement merchant discovery logic
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/rest/v1/merchants?select=id,shop_domain,access_token&limit=1`, {
      headers: {
        'apikey': Deno.env.get('SUPABASE_ANON_KEY')!,
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch merchant data');
      return null;
    }

    const merchants = await response.json();
    return merchants?.[0] || null;

  } catch (error) {
    console.error('Error fetching merchant:', error);
    return null;
  }
}

async function lookupOrderFromShopify(
  shopDomain: string, 
  accessToken: string, 
  orderNumber: string, 
  customerEmail: string
) {
  try {
    const cleanOrderNumber = orderNumber.replace('#', '');
    
    // Try multiple order lookup strategies
    const lookupStrategies = [
      `name:${cleanOrderNumber}`,
      `name:%23${cleanOrderNumber}`,
      `name:ORD-${cleanOrderNumber}`,
      `email:${customerEmail} AND name:${cleanOrderNumber}`
    ];

    for (const query of lookupStrategies) {
      const orders = await fetchOrdersFromShopify(shopDomain, accessToken, query);
      
      if (orders && orders.length > 0) {
        // Find exact match by email
        const matchingOrder = orders.find((order: any) => 
          order.email?.toLowerCase() === customerEmail.toLowerCase()
        );

        if (matchingOrder) {
          return formatOrderData(matchingOrder);
        }
      }
    }

    return null;

  } catch (error) {
    console.error('Shopify lookup error:', error);
    return null;
  }
}

async function fetchOrdersFromShopify(shopDomain: string, accessToken: string, query: string) {
  try {
    const url = `https://${shopDomain}/admin/api/2025-07/orders.json?query=${encodeURIComponent(query)}&limit=10`;
    
    const response = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Shopify API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.orders || [];

  } catch (error) {
    console.error('Error fetching from Shopify:', error);
    return null;
  }
}

function formatOrderData(shopifyOrder: any) {
  return {
    id: shopifyOrder.id.toString(),
    shopify_order_id: shopifyOrder.name || shopifyOrder.id.toString(),
    customer_email: shopifyOrder.email,
    total_amount: parseFloat(shopifyOrder.total_price || '0'),
    status: shopifyOrder.financial_status || 'unknown',
    created_at: shopifyOrder.created_at,
    items: (shopifyOrder.line_items || []).map((item: any) => ({
      id: item.id.toString(),
      product_id: item.product_id?.toString() || '',
      product_name: item.name || '',
      price: parseFloat(item.price || '0'),
      quantity: item.quantity || 1
    }))
  };
}