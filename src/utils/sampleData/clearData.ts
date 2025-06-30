
import { supabase } from '@/integrations/supabase/client';

export const clearAllSampleData = async () => {
  try {
    console.log('Clearing all sample data...');

    // Delete in reverse order to respect foreign key constraints
    // Use explicit table names to satisfy TypeScript
    const clearOperations = [
      { table: 'analytics_events' as const, name: 'analytics_events' },
      { table: 'billing_records' as const, name: 'billing_records' }, 
      { table: 'ai_suggestions' as const, name: 'ai_suggestions' },
      { table: 'return_items' as const, name: 'return_items' },
      { table: 'returns' as const, name: 'returns' },
      { table: 'merchants' as const, name: 'merchants' }
    ];

    for (const operation of clearOperations) {
      try {
        const { error } = await supabase
          .from(operation.table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          console.warn(`Warning clearing ${operation.name}:`, error.message);
          // Continue with other tables even if one fails
        } else {
          console.log(`Cleared ${operation.name} successfully`);
        }
      } catch (tableError) {
        console.warn(`Error clearing ${operation.name}:`, tableError);
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
