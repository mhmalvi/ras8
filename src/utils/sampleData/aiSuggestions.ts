
import { supabase } from '@/integrations/supabase/client';
import type { SampleAISuggestion } from './types';
import { SUGGESTION_PRODUCTS, REASONING_TEMPLATES } from './constants';

export const createSampleAISuggestions = async (returns: any[]): Promise<number> => {
  if (!returns || returns.length === 0) {
    throw new Error('No returns provided for creating AI suggestions');
  }

  console.log(`Creating AI suggestions for ${returns.length} returns`);

  const sampleAISuggestions: SampleAISuggestion[] = [];

  returns.forEach(returnItem => {
    if (Math.random() > 0.3) {
      sampleAISuggestions.push({
        return_id: returnItem.id,
        suggestion_type: 'product_exchange',
        suggested_product_name: SUGGESTION_PRODUCTS[Math.floor(Math.random() * SUGGESTION_PRODUCTS.length)],
        confidence_score: Math.round((Math.random() * 0.3 + 0.7) * 100) / 100, // Generate 0.70 - 1.00 with 2 decimal places
        reasoning: REASONING_TEMPLATES[Math.floor(Math.random() * REASONING_TEMPLATES.length)],
        accepted: Math.random() > 0.4 ? (Math.random() > 0.7 ? true : false) : null
      });
    }
  });

  try {
    console.log(`Inserting ${sampleAISuggestions.length} AI suggestions:`, sampleAISuggestions.slice(0, 2)); // Log first 2 for debugging
    
    const { error } = await supabase
      .from('ai_suggestions')
      .insert(sampleAISuggestions);

    if (error) {
      console.error('Supabase error creating AI suggestions:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to create AI suggestions: ${error.message}`);
    }

    console.log(`Successfully created ${sampleAISuggestions.length} AI suggestions`);
    return sampleAISuggestions.length;
  } catch (error) {
    console.error('AI suggestions creation failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};
