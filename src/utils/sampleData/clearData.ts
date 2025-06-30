
import { supabase } from '@/integrations/supabase/client';

export const clearAllSampleData = async () => {
  try {
    console.log('Clearing all sample data...');

    // Delete in reverse order to respect foreign key constraints
    const tables = [
      'analytics_events',
      'billing_records', 
      'ai_suggestions',
      'return_items',
      'returns',
      'merchants'
    ];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          console.warn(`Warning clearing ${table}:`, error.message);
          // Continue with other tables even if one fails
        } else {
          console.log(`Cleared ${table} successfully`);
        }
      } catch (tableError) {
        console.warn(`Error clearing ${table}:`, tableError);
        // Continue with other tables
      }
    }

    console.log('Sample data clearing completed');
    return { success: true };
  } catch (error) {
    console.error('Error during data clearing:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during clearing'
    };
  }
};
