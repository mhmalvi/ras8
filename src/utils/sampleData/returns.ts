
import { supabase } from '@/integrations/supabase/client';
import type { SampleReturn } from './types';
import { RETURN_REASONS, CUSTOMER_EMAILS } from './constants';

export const createSampleReturns = async (merchantIds: string[]): Promise<any[]> => {
  if (!merchantIds || merchantIds.length === 0) {
    throw new Error('No merchant IDs provided for creating returns');
  }

  const sampleReturns: SampleReturn[] = [];
  const statuses: ('requested' | 'approved' | 'in_transit' | 'completed')[] = [
    'requested', 'approved', 'in_transit', 'completed'
  ];

  merchantIds.forEach((merchantId, merchantIndex) => {
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);

      sampleReturns.push({
        merchant_id: merchantId,
        shopify_order_id: `ORD-2024-${(merchantIndex * 1000 + i + 1001).toString()}`,
        customer_email: CUSTOMER_EMAILS[Math.floor(Math.random() * CUSTOMER_EMAILS.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        reason: RETURN_REASONS[Math.floor(Math.random() * RETURN_REASONS.length)],
        total_amount: Math.round((Math.random() * 300 + 20) * 100) / 100,
        created_at: createdAt.toISOString()
      });
    }
  });

  try {
    const { data: returns, error } = await supabase
      .from('returns')
      .insert(sampleReturns)
      .select();

    if (error) {
      console.error('Error creating returns:', error);
      throw new Error(`Failed to create returns: ${error.message}`);
    }

    if (!returns || returns.length === 0) {
      throw new Error('No returns were created');
    }

    return returns;
  } catch (error) {
    console.error('Returns creation failed:', error);
    throw error;
  }
};
