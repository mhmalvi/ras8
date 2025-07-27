import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logEvent = (event: string, data?: any) => {
  console.log(`[STRIPE-WEBHOOK] ${event}`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe with secret key
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey || !webhookSecret) {
      throw new Error("Missing Stripe configuration");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    
    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the request body and signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    
    if (!signature) {
      throw new Error("No stripe signature found");
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logEvent("Webhook verified", { type: event.type, id: event.id });
    } catch (err) {
      logEvent("Webhook signature verification failed", { error: err.message });
      return new Response(`Webhook signature verification failed: ${err.message}`, { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionEvent(event, supabase);
        break;
        
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
        await handleInvoiceEvent(event, supabase);
        break;
        
      case 'customer.created':
      case 'customer.updated':
        await handleCustomerEvent(event, supabase);
        break;
        
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
        await handlePaymentEvent(event, supabase);
        break;
        
      default:
        logEvent("Unhandled event type", { type: event.type });
    }

    // Log webhook activity
    await supabase.from('webhook_activity').insert({
      webhook_type: 'stripe',
      source: 'stripe',
      status: 'processed',
      payload: event,
      processing_time_ms: Date.now() - new Date(event.created * 1000).getTime(),
    });

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    logEvent("Webhook processing error", { error: error.message });
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleSubscriptionEvent(event: Stripe.Event, supabase: any) {
  const subscription = event.data.object as Stripe.Subscription;
  const customerId = subscription.customer as string;
  
  logEvent("Processing subscription event", { 
    type: event.type, 
    subscriptionId: subscription.id,
    status: subscription.status 
  });

  try {
    // Get customer email
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    
    if (!customer.email) {
      throw new Error("Customer email not found");
    }

    // Determine subscription tier
    let subscriptionTier = 'starter';
    if (subscription.items.data.length > 0) {
      const price = subscription.items.data[0].price;
      const amount = price.unit_amount || 0;
      if (amount >= 14900) subscriptionTier = 'pro';
      else if (amount >= 7900) subscriptionTier = 'growth';
    }

    // Update billing record
    const subscriptionData = {
      stripe_customer_id: customerId,
      plan_type: subscription.status === 'active' ? subscriptionTier : 'starter',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Find merchant by customer email and update billing
    const { data: profiles } = await supabase
      .from('profiles')
      .select('merchant_id')
      .eq('email', customer.email)
      .single();

    if (profiles?.merchant_id) {
      await supabase
        .from('billing_records')
        .upsert({
          merchant_id: profiles.merchant_id,
          ...subscriptionData,
        }, { onConflict: 'merchant_id' });

      // Update merchant plan type
      await supabase
        .from('merchants')
        .update({ plan_type: subscriptionData.plan_type })
        .eq('id', profiles.merchant_id);

      logEvent("Billing record updated", { merchantId: profiles.merchant_id, plan: subscriptionData.plan_type });
    }

    // Create notification for subscription changes
    if (event.type === 'customer.subscription.deleted') {
      await supabase.rpc('create_notification', {
        p_merchant_id: profiles?.merchant_id,
        p_type: 'billing',
        p_title: 'Subscription Cancelled',
        p_message: 'Your subscription has been cancelled. Access to premium features will be limited.',
        p_priority: 'high'
      });
    }

  } catch (error) {
    logEvent("Error processing subscription event", { error: error.message });
    throw error;
  }
}

async function handleInvoiceEvent(event: Stripe.Event, supabase: any) {
  const invoice = event.data.object as Stripe.Invoice;
  
  logEvent("Processing invoice event", { 
    type: event.type, 
    invoiceId: invoice.id,
    status: invoice.status 
  });

  if (event.type === 'invoice.payment_failed') {
    // Get customer and notify merchant
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });
    const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
    
    if (customer.email) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('merchant_id')
        .eq('email', customer.email)
        .single();

      if (profiles?.merchant_id) {
        await supabase.rpc('create_notification', {
          p_merchant_id: profiles.merchant_id,
          p_type: 'billing',
          p_title: 'Payment Failed',
          p_message: 'Your recent payment could not be processed. Please update your payment method.',
          p_priority: 'high'
        });
      }
    }
  }
}

async function handleCustomerEvent(event: Stripe.Event, supabase: any) {
  const customer = event.data.object as Stripe.Customer;
  logEvent("Processing customer event", { type: event.type, customerId: customer.id });
  
  // Update customer information if needed
  // This could include updating profile data or merchant settings
}

async function handlePaymentEvent(event: Stripe.Event, supabase: any) {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  logEvent("Processing payment event", { 
    type: event.type, 
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status 
  });
  
  // Handle one-time payments if applicable
  // Could trigger notifications or update usage counters
}