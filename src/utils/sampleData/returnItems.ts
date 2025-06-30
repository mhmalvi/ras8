
import { supabase } from '@/integrations/supabase/client';
import type { SampleReturnItem } from './types';
import { PRODUCT_NAMES } from './constants';

export const createSampleReturnItems = async (returns: any[]): Promise<number> => {
  const sampleReturnItems: SampleReturnItem[] = [];

  returns.forEach(returnItem => {
    const numItems = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numItems; i++) {
      sampleReturnItems.push({
        return_id: returnItem.id,
        product_id: `PROD-${Math.floor(Math.random() * 10000)}`,
        product_name: PRODUCT_NAMES[Math.floor(Math.random() * PRODUCT_NAMES.length)],
        quantity: Math.floor(Math.random() * 2) + 1,
        price: Math.round((Math.random() * 150 + 10) * 100) / 100,
        action: Math.random() > 0.6 ? 'exchange' : 'refund'
      });
    }
  });

  const { error } = await supabase
    .from('return_items')
    .insert(sampleReturnItems);

  if (error) throw error;
  return sampleReturnItems.length;
};
