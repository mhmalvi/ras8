import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderLookupResult {
  success: boolean;
  order?: any;
  error?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { shopDomain, orderNumber, customerEmail, accessToken } = await req.json();
    
    if (!shopDomain || !orderNumber || !customerEmail) {
      throw new Error('Shop domain, order number, and customer email are required');
    }

    console.log(`🔍 Looking up order ${orderNumber} for ${customerEmail} in ${shopDomain}`);
    
    const normalizedDomain = shopDomain.replace('.myshopify.com', '') + '.myshopify.com';
    const normalizedOrderNumber = orderNumber.replace('#', '');

    // If no access token provided, we'll do a limited lookup
    if (!accessToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Access token required for order lookup',
        message: 'Please provide a valid Shopify access token'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Search for order by name (order number)
    const orderByNameResponse = await fetch(
      `https://${normalizedDomain}/admin/api/2023-07/orders.json?name=%23${normalizedOrderNumber}&limit=10`,
      {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!orderByNameResponse.ok) {
      const errorText = await orderByNameResponse.text();
      throw new Error(`Shopify API error: ${orderByNameResponse.status} ${errorText}`);
    }

    const orderByNameData = await orderByNameResponse.json();
    let orders = orderByNameData.orders || [];

    // If no orders found by name, try searching by ID if it looks like a numeric ID
    if (orders.length === 0 && /^\d+$/.test(normalizedOrderNumber)) {
      try {
        const orderByIdResponse = await fetch(
          `https://${normalizedDomain}/admin/api/2023-07/orders/${normalizedOrderNumber}.json`,
          {
            headers: {
              'X-Shopify-Access-Token': accessToken,
              'Content-Type': 'application/json',
            },
          }
        );

        if (orderByIdResponse.ok) {
          const orderByIdData = await orderByIdResponse.json();
          if (orderByIdData.order) {
            orders = [orderByIdData.order];
          }
        }
      } catch (error) {
        console.log('Order ID lookup failed, continuing with name search results');
      }
    }

    if (orders.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order not found',
        message: `No order found with number ${orderNumber}`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find order matching customer email
    const matchingOrder = orders.find((order: any) => 
      order.email?.toLowerCase() === customerEmail.toLowerCase() ||
      order.customer?.email?.toLowerCase() === customerEmail.toLowerCase()
    );

    if (!matchingOrder) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Order found but email does not match',
        message: `Order ${orderNumber} exists but is associated with a different email address`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare simplified order data for return
    const orderData = {
      id: matchingOrder.id,
      name: matchingOrder.name,
      email: matchingOrder.email,
      customerEmail: matchingOrder.customer?.email,
      totalPrice: matchingOrder.total_price,
      subtotalPrice: matchingOrder.subtotal_price,
      totalTax: matchingOrder.total_tax,
      currency: matchingOrder.currency,
      financialStatus: matchingOrder.financial_status,
      fulfillmentStatus: matchingOrder.fulfillment_status,
      createdAt: matchingOrder.created_at,
      updatedAt: matchingOrder.updated_at,
      orderNumber: matchingOrder.order_number,
      lineItems: matchingOrder.line_items?.map((item: any) => ({
        id: item.id,
        name: item.name,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        productId: item.product_id,
        variantId: item.variant_id,
        vendor: item.vendor,
        fulfillmentStatus: item.fulfillment_status,
        totalDiscount: item.total_discount,
        image: item.image?.src
      })) || [],
      shippingAddress: matchingOrder.shipping_address ? {
        firstName: matchingOrder.shipping_address.first_name,
        lastName: matchingOrder.shipping_address.last_name,
        address1: matchingOrder.shipping_address.address1,
        address2: matchingOrder.shipping_address.address2,
        city: matchingOrder.shipping_address.city,
        province: matchingOrder.shipping_address.province,
        country: matchingOrder.shipping_address.country,
        zip: matchingOrder.shipping_address.zip
      } : null,
      customer: matchingOrder.customer ? {
        id: matchingOrder.customer.id,
        firstName: matchingOrder.customer.first_name,
        lastName: matchingOrder.customer.last_name,
        email: matchingOrder.customer.email,
        ordersCount: matchingOrder.customer.orders_count,
        totalSpent: matchingOrder.customer.total_spent
      } : null
    };

    console.log(`✅ Order found: ${matchingOrder.name} for ${customerEmail}`);

    const result: OrderLookupResult = {
      success: true,
      order: orderData,
      message: `Order ${matchingOrder.name} found successfully`
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Order lookup error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to lookup order. Please check your credentials and try again.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});