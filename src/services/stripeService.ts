
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
  returnLimit: number;
}

interface BillingInfo {
  customerId: string;
  subscriptionId: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  usageCount: number;
}

export class StripeService {
  private readonly plans: SubscriptionPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      features: ['Up to 100 returns/month', 'Basic AI suggestions', 'Email support'],
      returnLimit: 100
    },
    {
      id: 'growth',
      name: 'Growth', 
      price: 79,
      features: ['Up to 500 returns/month', 'Advanced AI suggestions', 'Priority support', 'Analytics dashboard'],
      returnLimit: 500
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 149,
      features: ['Unlimited returns', 'Custom AI training', 'Dedicated support', 'Advanced automations'],
      returnLimit: -1 // Unlimited
    }
  ];

  async createCheckoutSession(merchantId: string, planId: string): Promise<{ url?: string; error?: string }> {
    try {
      console.log('🛒 Creating Stripe checkout session for plan:', planId);

      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          merchantId,
          planId,
          successUrl: `${window.location.origin}/settings?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/settings`
        }
      });

      if (error) {
        console.error('❌ Checkout session creation failed:', error);
        throw error;
      }

      console.log('✅ Checkout session created successfully');
      return { url: data.url };
    } catch (error) {
      console.error('💥 Stripe service error:', error);
      return { error: error instanceof Error ? error.message : 'Failed to create checkout session' };
    }
  }

  async getBillingInfo(merchantId: string): Promise<BillingInfo | null> {
    try {
      const { data, error } = await supabase
        .from('billing_records')
        .select('*')
        .eq('merchant_id', merchantId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No billing record found
          return null;
        }
        throw error;
      }

      return {
        customerId: data.stripe_customer_id || '',
        subscriptionId: '', // Would be fetched from Stripe if needed
        plan: data.plan_type,
        status: 'active', // Would be fetched from Stripe
        currentPeriodEnd: data.current_period_end,
        usageCount: data.usage_count || 0
      };
    } catch (error) {
      console.error('Error fetching billing info:', error);
      return null;
    }
  }

  async checkUsageLimit(merchantId: string): Promise<{ withinLimit: boolean; usage: number; limit: number }> {
    try {
      const billingInfo = await this.getBillingInfo(merchantId);
      
      if (!billingInfo) {
        // Default to starter plan limits
        return { withinLimit: false, usage: 0, limit: 100 };
      }

      const plan = this.plans.find(p => p.id === billingInfo.plan);
      if (!plan) {
        return { withinLimit: false, usage: billingInfo.usageCount, limit: 100 };
      }

      const withinLimit = plan.returnLimit === -1 || billingInfo.usageCount < plan.returnLimit;
      
      return {
        withinLimit,
        usage: billingInfo.usageCount,
        limit: plan.returnLimit
      };
    } catch (error) {
      console.error('Error checking usage limit:', error);
      return { withinLimit: false, usage: 0, limit: 100 };
    }
  }

  async incrementUsage(merchantId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('billing_records')
        .update({ 
          usage_count: supabase.sql`usage_count + 1`,
          updated_at: new Date().toISOString()
        })
        .eq('merchant_id', merchantId);

      if (error) {
        console.error('Error incrementing usage:', error);
      }
    } catch (error) {
      console.error('Error incrementing usage:', error);
    }
  }

  getPlans(): SubscriptionPlan[] {
    return this.plans;
  }

  getPlan(planId: string): SubscriptionPlan | undefined {
    return this.plans.find(p => p.id === planId);
  }

  async cancelSubscription(merchantId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { merchantId }
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to cancel subscription' 
      };
    }
  }
}

export const stripeService = new StripeService();
