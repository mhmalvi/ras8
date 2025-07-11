
import { supabase } from '@/integrations/supabase/client';

export interface ReturnData {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  reason: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  merchant_id: string;
  return_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
    action: string;
  }>;
  ai_suggestions: Array<{
    id: string;
    suggested_product_name: string;
    confidence_score: number;
    reasoning: string;
  }>;
}

export class MerchantReturnsService {
  static async fetchReturns(merchantId?: string): Promise<ReturnData[]> {
    let query = supabase
      .from('returns')
      .select(`
        *,
        return_items (*),
        ai_suggestions (*)
      `);

    // Filter by merchant_id if provided
    if (merchantId) {
      query = query.eq('merchant_id', merchantId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching returns:', error);
      throw error;
    }

    return data || [];
  }

  static async updateReturnStatus(returnId: string, status: string, reason?: string): Promise<void> {
    const updateData: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (reason) {
      updateData.reason = reason;
    }

    const { error } = await supabase
      .from('returns')
      .update(updateData)
      .eq('id', returnId);

    if (error) {
      throw new Error(`Failed to update return: ${error.message}`);
    }
  }

  static async bulkUpdateReturns(returnIds: string[], status: string): Promise<void> {
    const { error } = await supabase
      .from('returns')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .in('id', returnIds);

    if (error) {
      throw new Error(`Failed to bulk update returns: ${error.message}`);
    }
  }
}
