
import { supabase } from '@/integrations/supabase/client';

export interface EdgeFunctionResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

/**
 * Generic Edge Function invoker utility (DRY principle)
 * Standardizes all Edge Function calls across the application
 */
export async function invokeEdgeFunction<T = any>(
  functionName: string, 
  payload: object = {}
): Promise<EdgeFunctionResponse<T>> {
  try {
    console.log(`🚀 Invoking edge function: ${functionName}`, payload);
    
    const { data, error } = await supabase.functions.invoke(functionName, { 
      body: payload 
    });

    if (error) {
      console.error(`❌ Edge function error [${functionName}]:`, error);
      throw new Error(error.message || `Edge function ${functionName} failed`);
    }

    console.log(`✅ Edge function success [${functionName}]:`, data);
    
    return {
      data,
      success: true
    };
  } catch (error) {
    console.error(`💥 Edge function exception [${functionName}]:`, error);
    return {
      error: error instanceof Error ? error.message : `Unknown error in ${functionName}`,
      success: false
    };
  }
}

/**
 * Batch invoke multiple edge functions
 */
export async function invokeEdgeFunctionsBatch<T = any>(
  requests: Array<{ functionName: string; payload: object }>
): Promise<Array<EdgeFunctionResponse<T>>> {
  const promises = requests.map(({ functionName, payload }) =>
    invokeEdgeFunction<T>(functionName, payload)
  );
  
  return Promise.all(promises);
}
