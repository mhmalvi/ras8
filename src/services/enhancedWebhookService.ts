
interface ComprehensiveWebhookPayload {
  event: string;
  version: string;
  timestamp: string;
  source: string;
  merchantId: string;
  tenantIsolated: boolean;
  
  // Core data
  orderDetails?: {
    id: string;
    order_number: string;
    email: string;
    total_price: string;
    currency: string;
    status: string;
    financial_status?: string;
    fulfillment_status?: string;
    created_at: string;
    updated_at?: string;
    cancelled_at?: string;
    tags?: string;
    addresses?: {
      shipping: any;
      billing: any;
    };
  };
  
  customerDetails?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    accepts_marketing?: boolean;
  };
  
  itemDetails?: Array<{
    id: string;
    product_id: string;
    variant_id?: string;
    name: string;
    quantity: number;
    price: string;
    sku?: string;
    fulfillable_quantity?: number;
    fulfillment_status?: string;
  }>;
  
  returnDetails?: {
    id: string;
    order_id: string;
    status: string;
    reason?: string;
    refund_amount?: string;
    created_at: string;
    updated_at?: string;
    approved_at?: string;
    completed_at?: string;
    items?: Array<{
      id: string;
      product_id: string;
      quantity: number;
      reason?: string;
      condition?: string;
    }>;
  };
  
  appDetails?: {
    uninstalled_at?: string;
    reason?: string;
    shop_domain: string;
  };
  
  metadata: {
    webhook_id: string;
    source_topic: string;
    merchant_id: string;
    tenant_isolated: true;
    comprehensive: true;
    scopes_covered: string[];
    payload_version: string;
  };
}

export class EnhancedWebhookService {
  static buildComprehensivePayload(
    event: string,
    merchantId: string,
    data: any,
    topic: string
  ): ComprehensiveWebhookPayload {
    
    const basePayload: ComprehensiveWebhookPayload = {
      event,
      version: '2.0',
      timestamp: new Date().toISOString(),
      source: 'returns_automation_saas',
      merchantId,
      tenantIsolated: true,
      metadata: {
        webhook_id: `webhook_${Date.now()}_${merchantId}`,
        source_topic: topic,
        merchant_id: merchantId,
        tenant_isolated: true,
        comprehensive: true,
        scopes_covered: [],
        payload_version: '2.0'
      }
    };

    // Build comprehensive payload based on event type
    switch (topic) {
      case 'orders/create':
      case 'orders/updated':
      case 'orders/cancelled':
        basePayload.orderDetails = {
          id: data.id || data.shopify_order_id,
          order_number: data.order_number || `#${data.id}`,
          email: data.email || data.customer?.email || '',
          total_price: data.total_price || '0.00',
          currency: data.currency || 'USD',
          status: this.getOrderStatus(topic, data),
          financial_status: data.financial_status,
          fulfillment_status: data.fulfillment_status,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at,
          cancelled_at: data.cancelled_at,
          tags: data.tags,
          addresses: {
            shipping: data.shipping_address,
            billing: data.billing_address
          }
        };
        
        basePayload.customerDetails = {
          id: data.customer?.id || data.id,
          email: data.customer?.email || data.email || '',
          first_name: data.customer?.first_name || '',
          last_name: data.customer?.last_name || '',
          phone: data.customer?.phone,
          accepts_marketing: data.customer?.accepts_marketing
        };
        
        basePayload.itemDetails = data.line_items?.map((item: any) => ({
          id: item.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          sku: item.sku,
          fulfillable_quantity: item.fulfillable_quantity,
          fulfillment_status: item.fulfillment_status
        })) || [];
        
        basePayload.metadata.scopes_covered = ['orders', 'customers', 'line_items'];
        break;

      case 'returns/created':
      case 'returns/approved':
      case 'returns/completed':
        basePayload.returnDetails = {
          id: data.return_id || `return_${data.id}`,
          order_id: data.shopify_order_id || data.id,
          status: this.getReturnStatus(topic),
          reason: data.return_reason || data.reason || 'No reason provided',
          refund_amount: data.refund_amount || data.total_price,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at,
          approved_at: topic === 'returns/approved' ? new Date().toISOString() : undefined,
          completed_at: topic === 'returns/completed' ? new Date().toISOString() : undefined,
          items: data.items?.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            quantity: item.quantity,
            reason: item.reason || 'Return requested',
            condition: item.condition
          })) || []
        };
        
        // Also include order details for context
        basePayload.orderDetails = {
          id: data.shopify_order_id || data.id,
          order_number: data.order_number || `#${data.id}`,
          email: data.customer_email || data.email || '',
          total_price: data.total_amount || data.total_price || '0.00',
          currency: data.currency || 'USD',
          status: 'completed',
          created_at: data.order_created_at || data.created_at || new Date().toISOString()
        };
        
        basePayload.customerDetails = {
          id: data.customer_id || data.id,
          email: data.customer_email || data.email || '',
          first_name: data.customer_first_name || '',
          last_name: data.customer_last_name || ''
        };
        
        basePayload.metadata.scopes_covered = ['returns', 'orders', 'customers'];
        break;

      case 'app/uninstalled':
        basePayload.appDetails = {
          uninstalled_at: new Date().toISOString(),
          reason: 'Merchant uninstalled app',
          shop_domain: data.shop_domain || data.domain || ''
        };
        
        basePayload.metadata.scopes_covered = ['app'];
        break;

      default:
        // For unknown events, include raw data
        basePayload.metadata.scopes_covered = ['unknown'];
    }

    return basePayload;
  }

  private static getOrderStatus(topic: string, data: any): string {
    switch (topic) {
      case 'orders/create':
        return 'created';
      case 'orders/updated':
        return 'updated';
      case 'orders/cancelled':
        return 'cancelled';
      default:
        return data.financial_status || 'pending';
    }
  }

  private static getReturnStatus(topic: string): string {
    switch (topic) {
      case 'returns/created':
        return 'requested';
      case 'returns/approved':
        return 'approved';
      case 'returns/completed':
        return 'completed';
      default:
        return 'pending';
    }
  }
}
