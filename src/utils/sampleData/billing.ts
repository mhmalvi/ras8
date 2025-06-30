
import { supabase } from '@/integrations/supabase/client';

export const createSampleBilling = async (merchants: any[]): Promise<number> => {
  if (!merchants || merchants.length === 0) {
    throw new Error('No merchants provided for creating billing records');
  }

  console.log(`Creating billing records for ${merchants.length} merchants`);

  const billingRecords = merchants.map(merchant => ({
    merchant_id: merchant.id,
    plan_type: merchant.plan_type,
    usage_count: Math.floor(Math.random() * 50) + 10,
    stripe_customer_id: `cus_sample_${merchant.id.slice(0, 8)}`,
    current_period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }));

  try {
    console.log(`Inserting ${billingRecords.length} billing records:`, billingRecords.slice(0, 2)); // Log first 2 for debugging
    
    const { error } = await supabase
      .from('billing_records')
      .insert(billingRecords);

    if (error) {
      console.error('Supabase error creating billing records:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to create billing records: ${error.message}`);
    }

    console.log(`Successfully created ${billingRecords.length} billing records`);
    return billingRecords.length;
  } catch (error) {
    console.error('Billing records creation failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};
