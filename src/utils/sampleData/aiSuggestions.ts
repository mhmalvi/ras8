
import { supabase } from '@/integrations/supabase/client';
import type { SampleAISuggestion } from './types';
import { SUGGESTION_PRODUCTS, REASONING_TEMPLATES } from './constants';

export const createSampleAISuggestions = async (returns: any[]): Promise<number> => {
  const sampleAISuggestions: SampleAISuggestion[] = [];

  returns.forEach(returnItem => {
    if (Math.random() > 0.3) {
      sampleAISuggestions.push({
        return_id: returnItem.id,
        suggestion_type: 'product_exchange',
        suggested_product_name: SUGGESTION_PRODUCTS[Math.floor(Math.random() * SUGGESTION_PRODUCTS.length)],
        confidence_score: Math.floor(Math.random() * 30) + 70,
        reasoning: REASONING_TEMPLATES[Math.floor(Math.random() * REASONING_TEMPLATES.length)],
        accepted: Math.random() > 0.4 ? (Math.random() > 0.7 ? true : false) : null
      });
    }
  });

  const { error } = await supabase
    .from('ai_suggestions')
    .insert(sampleAISuggestions);

  if (error) throw error;
  return sampleAISuggestions.length;
};
