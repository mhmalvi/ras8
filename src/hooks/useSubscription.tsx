
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionData {
  subscribed: boolean;
  plan_type: string;
  trial_active: boolean;
  subscription_end?: string;
  stripe_customer_id?: string;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    subscribed: false,
    plan_type: 'starter',
    trial_active: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 Checking subscription status...');
      const { data, error } = await supabase.functions.invoke('check-subscription');

      if (error) {
        console.error('❌ Subscription check failed:', error);
        throw error;
      }

      console.log('✅ Subscription data received:', data);
      setSubscriptionData(data);
      setError(null);
    } catch (err) {
      console.error('💥 Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createCheckout = useCallback(async (planType: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to subscribe to a plan",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🛒 Creating checkout session for plan:', planType);
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });

      if (error) {
        console.error('❌ Checkout creation failed:', error);
        throw error;
      }

      console.log('✅ Checkout session created, redirecting...');
      
      // Open Stripe checkout in current tab
      window.location.href = data.url;
    } catch (err) {
      console.error('💥 Error creating checkout:', err);
      toast({
        title: "Checkout Error",
        description: err instanceof Error ? err.message : 'Failed to create checkout session',
        variant: "destructive"
      });
    }
  }, [user, toast]);

  const openCustomerPortal = useCallback(async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to manage your subscription",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🎛️ Opening customer portal...');
      
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('❌ Customer portal failed:', error);
        throw error;
      }

      console.log('✅ Customer portal session created, redirecting...');
      
      // Open customer portal in new tab
      window.open(data.url, '_blank');
    } catch (err) {
      console.error('💥 Error opening customer portal:', err);
      toast({
        title: "Portal Error",
        description: err instanceof Error ? err.message : 'Failed to open customer portal',
        variant: "destructive"
      });
    }
  }, [user, toast]);

  useEffect(() => {
    checkSubscription();
    
    // Auto-refresh subscription status every 30 seconds
    const interval = setInterval(checkSubscription, 30000);
    
    return () => clearInterval(interval);
  }, [checkSubscription]);

  return {
    subscriptionData,
    loading,
    error,
    checkSubscription,
    createCheckout,
    openCustomerPortal
  };
};
