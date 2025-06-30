
import { supabase } from '@/integrations/supabase/client';

export const clearAllSampleData = async () => {
  try {
    console.log('Clearing all sample data...');

    // Delete in reverse order to respect foreign key constraints
    await supabase.from('analytics_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('billing_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('ai_suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('return_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('returns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('merchants').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('All sample data cleared successfully');
    return { success: true };
  } catch (error) {
    console.error('Error clearing sample data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
