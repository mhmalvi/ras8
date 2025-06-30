
import { supabase } from '@/integrations/supabase/client';

export const createSampleBilling = async (merchants: any[]): Promise<number> => {
  const billingRecords = merchants.map(merchant => ({
    merchant_id: merchant.id,
    plan_type: merchant.plan_type,
    usage_count: Math.floor(Math.random() * 50) + 10,
    stripe_customer_id: `cus_sample_${merchant.id.slice(0, 8)}`,
    current_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const { error } = await supabase
    .from('billing_records')
    .insert(billingRecords);

  if (error) throw error;
  return billingRecords.length;
};
