import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMerchantProfile } from './useMerchantProfile';

interface BillingData {
  usage_count: number;
  plan_type: string;
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id: string | null;
}

interface UsageStats {
  current_usage: number;
  plan_limit: number;
  usage_percentage: number;
  period_start: string;
  period_end: string;
}

export const useRealBillingData = () => {
  const [billingData, setBillingData] = useState<BillingData | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { profile } = useMerchantProfile();

  const getPlanLimit = (planType: string): number => {
    switch (planType) {
      case 'starter': return 100;
      case 'growth': return 500;
      case 'pro': return -1; // Unlimited
      default: return 100;
    }
  };

  const fetchBillingData = async () => {
    if (!profile?.merchant_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch billing records for the merchant
      const { data: billingRecord, error: billingError } = await supabase
        .from('billing_records')
        .select('*')
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (billingError) {
        console.error('Billing fetch error:', billingError);
        // Create default billing record if none exists
        const defaultBilling = {
          merchant_id: profile.merchant_id,
          plan_type: 'starter',
          usage_count: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          stripe_customer_id: null
        };

        const { data: newBilling, error: insertError } = await supabase
          .from('billing_records')
          .insert(defaultBilling)
          .select()
          .single();

        if (insertError) throw insertError;
        setBillingData(newBilling);
      } else if (billingRecord) {
        setBillingData(billingRecord);
      }

      // Calculate usage stats
      if (billingRecord || billingData) {
        const currentData = billingRecord || billingData;
        if (currentData) {
          const planLimit = getPlanLimit(currentData.plan_type);
          const usagePercentage = planLimit > 0 ? (currentData.usage_count / planLimit) * 100 : 0;

          setUsageStats({
            current_usage: currentData.usage_count,
            plan_limit: planLimit,
            usage_percentage: Math.min(usagePercentage, 100),
            period_start: currentData.current_period_start,
            period_end: currentData.current_period_end
          });
        }
      }

    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async () => {
    if (!profile?.merchant_id || !billingData) return;

    try {
      const { error } = await supabase
        .from('billing_records')
        .update({ 
          usage_count: billingData.usage_count + 1,
          updated_at: new Date().toISOString()
        })
        .eq('merchant_id', profile.merchant_id);

      if (error) throw error;

      // Update local state
      setBillingData(prev => prev ? { ...prev, usage_count: prev.usage_count + 1 } : null);
      
      // Recalculate usage stats
      if (billingData) {
        const planLimit = getPlanLimit(billingData.plan_type);
        const newUsage = billingData.usage_count + 1;
        const usagePercentage = planLimit > 0 ? (newUsage / planLimit) * 100 : 0;

        setUsageStats(prev => prev ? {
          ...prev,
          current_usage: newUsage,
          usage_percentage: Math.min(usagePercentage, 100)
        } : null);
      }

    } catch (err) {
      console.error('Error incrementing usage:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [profile?.merchant_id]);

  return {
    billingData,
    usageStats,
    loading,
    error,
    refetch: fetchBillingData,
    incrementUsage
  };
};