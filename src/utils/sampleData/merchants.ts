
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

  const { data: merchants, error } = await supabase
    .from('merchants')
    .insert(sampleMerchants)
    .select();

  if (error) throw error;
  return merchants;
};
