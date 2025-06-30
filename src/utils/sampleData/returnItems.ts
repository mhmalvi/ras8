
import { supabase } from '@/integrations/supabase/client';
import type { SampleReturnItem } from './types';
import { PRODUCT_NAMES } from './constants';

export const createSampleReturnItems = async (returns: any[]): Promise<number> => {
  if (!returns || returns.length === 0) {
    throw new Error('No returns provided for creating return items');
  }

  console.log(`Creating return items for ${returns.length} returns`);

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

  try {
    console.log(`Inserting ${sampleReturnItems.length} return items:`, sampleReturnItems.slice(0, 2)); // Log first 2 for debugging
    
    const { error } = await supabase
      .from('return_items')
      .insert(sampleReturnItems);

    if (error) {
      console.error('Supabase error creating return items:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to create return items: ${error.message}`);
    }

    console.log(`Successfully created ${sampleReturnItems.length} return items`);
    return sampleReturnItems.length;
  } catch (error) {
    console.error('Return items creation failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};
