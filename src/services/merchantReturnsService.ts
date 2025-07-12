
import { supabase } from '@/integrations/supabase/client';

export interface ReturnData {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  status: string;
  reason: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  merchant_id: string;
  return_items?: Array<{
    id: string;
    product_name: string;
    quantity: number;
    action: string;
    price: number;
  }>;
  ai_suggestions?: Array<{
    id: string;
    suggestion_type: string;
    confidence_score: number;
    accepted: boolean | null;
    reasoning: string;
  }>;
}

export class MerchantReturnsService {
  static async fetchReturns(merchantId: string): Promise<ReturnData[]> {
    console.log('🔍 Fetching returns for merchant:', merchantId);

    try {
      const { data: returns, error } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (*),
          ai_suggestions (*)
        `)
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('💥 Error fetching returns:', error);
        throw error;
      }

      console.log('✅ Fetched returns:', returns?.length || 0);
      return returns || [];

    } catch (error) {
      console.error('💥 Service error fetching returns:', error);
      throw error;
    }
  }

  static async updateReturnStatus(
    returnId: string, 
    status: string, 
    reason?: string
  ): Promise<void> {
    console.log('🔄 Updating return status:', { returnId, status, reason });

    try {
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
        console.error('💥 Error updating return status:', error);
        throw error;
      }

      console.log('✅ Return status updated successfully');

      // Log the status change as an analytics event
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'return_status_changed',
          event_data: {
            return_id: returnId,
            new_status: status,
            reason,
            timestamp: new Date().toISOString()
          }
        });

    } catch (error) {
      console.error('💥 Service error updating return:', error);
      throw error;
    }
  }

  static async bulkUpdateReturns(
    returnIds: string[], 
    status: string
  ): Promise<void> {
    console.log('🔄 Bulk updating returns:', { returnIds, status });

    try {
      const { error } = await supabase
        .from('returns')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', returnIds);

      if (error) {
        console.error('💥 Error bulk updating returns:', error);
        throw error;
      }

      console.log('✅ Bulk update completed successfully');

      // Log the bulk operation
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'bulk_return_update',
          event_data: {
            return_ids: returnIds,
            new_status: status,
            count: returnIds.length,
            timestamp: new Date().toISOString()
          }
        });

    } catch (error) {
      console.error('💥 Service error in bulk update:', error);
      throw error;
    }
  }

  static async subscribeToReturns(
    merchantId: string,
    callback: (returns: ReturnData[]) => void
  ) {
    console.log('📡 Setting up real-time returns subscription for merchant:', merchantId);

    const channel = supabase
      .channel(`returns-${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `merchant_id=eq.${merchantId}`
        },
        async () => {
          console.log('🔄 Returns data changed, refreshing...');
          try {
            const updatedReturns = await this.fetchReturns(merchantId);
            callback(updatedReturns);
          } catch (error) {
            console.error('💥 Error refreshing returns:', error);
          }
        }
      )
      .subscribe();

    return channel;
  }
}
