
import { supabase } from '@/integrations/supabase/client';
import type { SampleMerchant } from './types';

export const createSampleMerchants = async (): Promise<any[]> => {
  const timestamp = Date.now();
  const sampleMerchants: SampleMerchant[] = [
    {
      shop_domain: `techgear-store-${timestamp}.myshopify.com`,
      access_token: `sample_access_token_1_${timestamp}`,
      plan_type: 'growth',
      settings: { auto_approve_exchanges: true, email_notifications: true }
    },
    {
      shop_domain: `fashion-boutique-${timestamp}.myshopify.com`,
      access_token: `sample_access_token_2_${timestamp}`,
      plan_type: 'pro',
      settings: { auto_approve_exchanges: false, email_notifications: true }
    },
    {
      shop_domain: `home-essentials-${timestamp}.myshopify.com`,
      access_token: `sample_access_token_3_${timestamp}`,
      plan_type: 'starter',
      settings: { auto_approve_exchanges: true, email_notifications: false }
    }
  ];

  try {
    console.log('Inserting merchants:', sampleMerchants);
    
    const { data: merchants, error } = await supabase
      .from('merchants')
      .insert(sampleMerchants)
      .select();

    if (error) {
      console.error('Supabase error creating merchants:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to create merchants: ${error.message}`);
    }

    if (!merchants || merchants.length === 0) {
      console.error('No merchants returned from insert operation');
      throw new Error('No merchants were created');
    }

    console.log('Successfully created merchants:', merchants);
    return merchants;
  } catch (error) {
    console.error('Merchants creation failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};
