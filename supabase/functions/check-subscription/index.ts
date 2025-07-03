
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0?target=deno&no-check";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    
    if (customers.data.length === 0) {
      logStep("No customer found, checking for existing billing record");
      
      // Update billing record to reflect no active subscription
      await supabaseClient.from("billing_records").upsert({
        merchant_id: null, // Will be set when merchant is assigned
        plan_type: 'starter',
        usage_count: 0,
        stripe_customer_id: null,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan_type: 'starter',
        trial_active: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 1,
    });

    let subscriptionData = {
      subscribed: false,
      plan_type: 'starter',
      trial_active: false,
      subscription_end: null,
      stripe_customer_id: customerId
    };

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const isActive = subscription.status === 'active' || subscription.status === 'trialing';
      const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      
      // Get plan type from price amount
      const priceId = subscription.items.data[0].price.id;
      const price = await stripe.prices.retrieve(priceId);
      const amount = price.unit_amount || 0;
      
      let planType = 'starter';
      if (amount >= 14900) planType = 'pro';
      else if (amount >= 7900) planType = 'growth';
      else if (amount >= 2900) planType = 'starter';

      subscriptionData = {
        subscribed: isActive,
        plan_type: planType,
        trial_active: subscription.status === 'trialing',
        subscription_end: subscriptionEnd,
        stripe_customer_id: customerId
      };

      logStep("Active subscription found", { 
        subscriptionId: subscription.id, 
        status: subscription.status,
        planType,
        endDate: subscriptionEnd 
      });
    }

    // Update billing record in Supabase
    await supabaseClient.from("billing_records").upsert({
      merchant_id: null, // Will be set when merchant is assigned
      plan_type: subscriptionData.plan_type,
      usage_count: 0,
      stripe_customer_id: subscriptionData.stripe_customer_id,
      current_period_start: new Date().toISOString(),
      current_period_end: subscriptionData.subscription_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    logStep("Updated billing record", subscriptionData);

    return new Response(JSON.stringify(subscriptionData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in check-subscription", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
