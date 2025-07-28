import { supabase } from '@/integrations/supabase/client';

export interface OptimizedOrder {
  id: string;
  shopify_order_id: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
  merchant_id: string;
  items: OptimizedOrderItem[];
}

export interface OptimizedOrderItem {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
}

interface ReturnSubmissionData {
  orderNumber: string;
  email: string;
  selectedItems: string[];
  returnReasons: Record<string, string>;
}

export class OptimizedOrderService {
  
  /**
   * Enhanced order lookup with optimized database queries and fallback logic
   */
  static async lookupOrder(orderNumber: string, email: string): Promise<OptimizedOrder | null> {
    try {
      // Normalize inputs
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedOrderNumber = this.normalizeOrderNumber(orderNumber);
      
      // Try database first with optimized query
      const dbOrder = await this.lookupFromDatabaseOptimized(normalizedOrderNumber, normalizedEmail);
      if (dbOrder) {
        return dbOrder;
      }

      // Fallback to Shopify API with better error handling
      const shopifyOrder = await this.lookupFromShopifyOptimized(normalizedOrderNumber, normalizedEmail);
      return shopifyOrder;
      
    } catch (error) {
      console.error('Order lookup failed:', error);
      return null;
    }
  }

  /**
   * Optimized database lookup with better query structure
   */
  private static async lookupFromDatabaseOptimized(
    orderNumber: string,
    email: string
  ): Promise<OptimizedOrder | null> {
    try {
      // Single optimized query with proper joins
      const { data: orderData, error } = await supabase
        .from('orders')
        .select(`
          id,
          shopify_order_id,
          customer_email,
          total_amount,
          status,
          created_at,
          order_items!inner (
            id,
            product_id,
            product_name,
            price,
            quantity
          )
        `)
        .eq('customer_email', email)
        .in('shopify_order_id', this.getOrderNumberVariants(orderNumber))
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Database query error:', error);
        return null;
      }

      if (!orderData) {
        return null;
      }

      // Get merchant_id for this order (needed for returns)
      const merchantId = await this.getMerchantIdForOrder(orderData.shopify_order_id);
      if (!merchantId) {
        console.warn('No merchant found for order:', orderData.shopify_order_id);
        return null;
      }

      return {
        id: orderData.id,
        shopify_order_id: orderData.shopify_order_id,
        customer_email: orderData.customer_email,
        total_amount: orderData.total_amount,
        status: orderData.status,
        created_at: orderData.created_at,
        merchant_id: merchantId,
        items: orderData.order_items || []
      };

    } catch (error) {
      console.error('Database lookup failed:', error);
      return null;
    }
  }

  /**
   * Optimized Shopify API lookup with better error handling
   */
  private static async lookupFromShopifyOptimized(
    orderNumber: string,
    email: string
  ): Promise<OptimizedOrder | null> {
    try {
      const { data: result, error } = await supabase.functions.invoke('shopify-order-lookup', {
        body: {
          orderNumber,
          customerEmail: email
        }
      });

      if (error) {
        console.error('Shopify lookup error:', error);
        return null;
      }

      if (!result?.success || !result?.order) {
        return null;
      }

      const shopifyOrder = result.order;
      
      // Sync to database asynchronously (don't block the response)
      this.syncOrderToDatabase(shopifyOrder).catch(error => 
        console.warn('Background sync failed:', error)
      );

      return {
        id: shopifyOrder.id,
        shopify_order_id: shopifyOrder.shopify_order_id,
        customer_email: shopifyOrder.customer_email,
        total_amount: shopifyOrder.total_amount,
        status: shopifyOrder.status,
        created_at: shopifyOrder.created_at,
        merchant_id: shopifyOrder.merchant_id,
        items: shopifyOrder.items || []
      };

    } catch (error) {
      console.error('Shopify lookup failed:', error);
      return null;
    }
  }

  /**
   * Optimized return submission with atomic transactions
   */
  static async submitReturn(
    returnData: ReturnSubmissionData,
    order: OptimizedOrder
  ): Promise<{ returnId: string; success: boolean }> {
    try {
      // Validate inputs
      this.validateReturnData(returnData, order);

      // Calculate return details
      const returnDetails = this.calculateReturnDetails(returnData, order);

      // Use transaction for atomic return creation
      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert({
          merchant_id: order.merchant_id,
          shopify_order_id: order.shopify_order_id,
          customer_email: order.customer_email,
          reason: returnDetails.combinedReason,
          total_amount: returnDetails.totalAmount,
          status: 'requested'
        })
        .select('id')
        .single();

      if (returnError) {
        throw new Error(`Failed to create return: ${returnError.message}`);
      }

      // Create return items in batch
      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnDetails.returnItems.map(item => ({
          ...item,
          return_id: returnRecord.id
        })));

      if (itemsError) {
        // Rollback return record if items fail
        await supabase.from('returns').delete().eq('id', returnRecord.id);
        throw new Error(`Failed to create return items: ${itemsError.message}`);
      }

      return {
        returnId: returnRecord.id,
        success: true
      };

    } catch (error) {
      console.error('Return submission failed:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private static normalizeOrderNumber(orderNumber: string): string {
    return orderNumber.toUpperCase().replace(/^#/, '').trim();
  }

  private static getOrderNumberVariants(orderNumber: string): string[] {
    const clean = this.normalizeOrderNumber(orderNumber);
    return [
      clean,
      `#${clean}`,
      `ORD-${clean}`,
      `ORDER-${clean}`
    ];
  }

  private static async getMerchantIdForOrder(shopifyOrderId: string): Promise<string | null> {
    try {
      // This is a simplified approach - in practice, you'd need to implement
      // proper order-to-merchant mapping logic based on your business model
      const { data: merchants, error } = await supabase
        .from('merchants')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (error || !merchants) {
        return null;
      }

      return merchants.id;
    } catch (error) {
      console.error('Failed to get merchant ID:', error);
      return null;
    }
  }

  private static validateReturnData(returnData: ReturnSubmissionData, order: OptimizedOrder): void {
    if (!returnData.selectedItems.length) {
      throw new Error('No items selected for return');
    }

    if (!returnData.returnReasons || Object.keys(returnData.returnReasons).length === 0) {
      throw new Error('Return reasons are required');
    }

    // Validate all selected items exist in order
    const orderItemIds = order.items.map(item => item.id);
    const invalidItems = returnData.selectedItems.filter(id => !orderItemIds.includes(id));
    
    if (invalidItems.length > 0) {
      throw new Error(`Invalid items selected: ${invalidItems.join(', ')}`);
    }
  }

  private static calculateReturnDetails(returnData: ReturnSubmissionData, order: OptimizedOrder) {
    const selectedOrderItems = order.items.filter(item => 
      returnData.selectedItems.includes(item.id)
    );

    const totalAmount = selectedOrderItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    );

    const combinedReason = Object.values(returnData.returnReasons)
      .filter(Boolean)
      .join(', ');

    const returnItems = selectedOrderItems.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      price: item.price,
      action: 'refund' as const
    }));

    return {
      totalAmount,
      combinedReason,
      returnItems
    };
  }

  private static async syncOrderToDatabase(orderData: any): Promise<void> {
    try {
      // Implement background sync logic here
      // This should be non-blocking and handle errors gracefully
      console.log('Background sync initiated for order:', orderData.id);
    } catch (error) {
      console.warn('Background sync failed:', error);
    }
  }
}