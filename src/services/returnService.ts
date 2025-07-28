
import { supabase } from '@/integrations/supabase/client';

interface ReturnRequest {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  status: string;
  reason: string;
  total_amount: number;
  created_at: string;
  items: ReturnItem[];
}

interface ReturnItem {
  id: string;
  product_name: string;
  quantity: number;
  price: number;
  action: string;
}

interface SubmitReturnData {
  orderNumber: string;
  email: string;
  selectedItems: string[];
  returnReasons: Record<string, string>;
}

export class ReturnService {
  static async fetchCustomerReturns(email: string, orderNumber?: string): Promise<ReturnRequest[]> {
    let query = supabase
      .from('returns')
      .select(`
        *,
        return_items (*)
      `)
      .ilike('customer_email', email);

    if (orderNumber) {
      query = query.eq('shopify_order_id', orderNumber);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching returns:', error);
      throw error;
    }

    return data?.map(returnItem => ({
      ...returnItem,
      items: returnItem.return_items || []
    })) || [];
  }

  static async submitReturn(returnData: SubmitReturnData, order: any): Promise<{ returnId: string }> {
    if (!order) throw new Error('Order not found');

    const selectedOrderItems = order.items.filter((item: any) => 
      returnData.selectedItems.includes(item.id)
    );

    if (selectedOrderItems.length === 0) {
      throw new Error('No items selected for return');
    }

    const totalAmount = selectedOrderItems.reduce(
      (sum: number, item: any) => sum + (item.price * item.quantity), 
      0
    );

    // Get merchant_id from the order's merchant information
    const merchantId = order.merchant_info?.merchant_id;
    if (!merchantId) {
      throw new Error('Unable to determine merchant for this order');
    }

    // Create the return record
    const { data: returnRecord, error: returnError } = await supabase
      .from('returns')
      .insert({
        shopify_order_id: returnData.orderNumber.replace('#', ''),
        customer_email: returnData.email.toLowerCase(),
        reason: Object.values(returnData.returnReasons).join(', '),
        total_amount: totalAmount,
        status: 'requested',
        merchant_id: merchantId
      })
      .select()
      .single();

    if (returnError) {
      throw new Error(`Failed to create return: ${returnError.message}`);
    }

    // Create return items
    const returnItems = selectedOrderItems.map((item: any) => ({
      return_id: returnRecord.id,
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      action: 'refund' as const
    }));

    const { error: itemsError } = await supabase
      .from('return_items')
      .insert(returnItems);

    if (itemsError) {
      throw new Error(`Failed to create return items: ${itemsError.message}`);
    }

    return { returnId: returnRecord.id };
  }

  static async updateReturn(returnId: string, updates: {
    selectedItems?: string[];
    returnReasons?: Record<string, string>;
  }): Promise<{ success: boolean }> {
    const { data: returnData, error: fetchError } = await supabase
      .from('returns')
      .select('*, return_items(*)')
      .eq('id', returnId)
      .single();

    if (fetchError) throw fetchError;

    if (!['requested', 'pending'].includes(returnData.status)) {
      throw new Error('This return cannot be modified as it has already been processed.');
    }

    if (updates.returnReasons) {
      const { error: updateError } = await supabase
        .from('returns')
        .update({
          reason: Object.values(updates.returnReasons).join(', '),
          updated_at: new Date().toISOString()
        })
        .eq('id', returnId);

      if (updateError) throw updateError;
    }

    return { success: true };
  }

  static async cancelReturn(returnId: string): Promise<{ success: boolean }> {
    const { data: returnData, error: fetchError } = await supabase
      .from('returns')
      .select('*')
      .eq('id', returnId)
      .single();

    if (fetchError) throw fetchError;

    if (!['requested', 'pending'].includes(returnData.status)) {
      throw new Error('This return cannot be cancelled as it has already been processed.');
    }

    const { error: deleteError } = await supabase
      .from('returns')
      .delete()
      .eq('id', returnId);

    if (deleteError) throw deleteError;

    return { success: true };
  }
}
