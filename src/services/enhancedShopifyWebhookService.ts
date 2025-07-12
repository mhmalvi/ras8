
import { supabase } from '@/integrations/supabase/client';
import { WebhookMonitoringService } from './webhookMonitoringService';

export class EnhancedShopifyWebhookService {
  static async processOrderWebhook(payload: any, merchantId: string) {
    const startTime = Date.now();
    let activityId: string | null = null;

    try {
      // Log webhook receipt
      const activity = await WebhookMonitoringService.logWebhookActivity({
        merchant_id: merchantId,
        webhook_type: 'order_created',
        source: 'shopify',
        status: 'received',
        payload
      });
      activityId = activity.id;

      console.log('🛍️ Processing Shopify order webhook:', payload.id);

      // Update status to processing
      await WebhookMonitoringService.updateWebhookStatus(activityId, 'processing');

      // Process the order
      const orderData = {
        shopify_order_id: payload.id.toString(),
        customer_email: payload.email || payload.customer?.email || 'unknown@example.com',
        total_amount: parseFloat(payload.total_price || '0'),
        status: 'completed'
      };

      // Insert order into database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Process order items
      if (payload.line_items && Array.isArray(payload.line_items)) {
        const orderItems = payload.line_items.map((item: any) => ({
          order_id: order.id,
          product_id: item.product_id?.toString() || 'unknown',
          product_name: item.name || 'Unknown Product',
          quantity: item.quantity || 1,
          price: parseFloat(item.price || '0')
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Trigger n8n automation workflow
      await this.triggerN8nWorkflow('order_created', {
        orderId: order.id,
        shopifyOrderId: payload.id,
        customerEmail: orderData.customer_email,
        totalAmount: orderData.total_amount,
        merchantId
      });

      const processingTime = Date.now() - startTime;
      await WebhookMonitoringService.updateWebhookStatus(
        activityId, 
        'completed', 
        { orderId: order.id },
        undefined,
        processingTime
      );

      console.log('✅ Order webhook processed successfully');
      return { success: true, orderId: order.id };

    } catch (error) {
      console.error('💥 Error processing order webhook:', error);
      
      if (activityId) {
        const processingTime = Date.now() - startTime;
        await WebhookMonitoringService.updateWebhookStatus(
          activityId,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error',
          processingTime
        );
      }

      throw error;
    }
  }

  static async processReturnWebhook(payload: any, merchantId: string) {
    const startTime = Date.now();
    let activityId: string | null = null;

    try {
      // Log webhook receipt
      const activity = await WebhookMonitoringService.logWebhookActivity({
        merchant_id: merchantId,
        webhook_type: 'return_requested',
        source: 'shopify',
        status: 'received',
        payload
      });
      activityId = activity.id;

      console.log('↩️ Processing Shopify return webhook:', payload.id);

      await WebhookMonitoringService.updateWebhookStatus(activityId, 'processing');

      // Process the return request
      // Implementation depends on Shopify's return webhook structure
      const returnData = {
        shopify_order_id: payload.order_id?.toString() || payload.id?.toString(),
        customer_email: payload.customer_email || 'unknown@example.com',
        reason: payload.reason || 'Customer requested return',
        total_amount: parseFloat(payload.total_amount || '0'),
        merchant_id: merchantId,
        status: 'requested'
      };

      const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert(returnData)
        .select()
        .single();

      if (returnError) throw returnError;

      // Trigger n8n return processing workflow
      await this.triggerN8nWorkflow('return_requested', {
        returnId: returnRecord.id,
        orderId: payload.order_id,
        customerEmail: returnData.customer_email,
        merchantId
      });

      const processingTime = Date.now() - startTime;
      await WebhookMonitoringService.updateWebhookStatus(
        activityId,
        'completed',
        { returnId: returnRecord.id },
        undefined,
        processingTime
      );

      console.log('✅ Return webhook processed successfully');
      return { success: true, returnId: returnRecord.id };

    } catch (error) {
      console.error('💥 Error processing return webhook:', error);
      
      if (activityId) {
        const processingTime = Date.now() - startTime;
        await WebhookMonitoringService.updateWebhookStatus(
          activityId,
          'failed',
          undefined,
          error instanceof Error ? error.message : 'Unknown error',
          processingTime
        );
      }

      throw error;
    }
  }

  static async triggerN8nWorkflow(workflowType: string, data: any) {
    console.log('🔗 Triggering n8n workflow:', workflowType);
    
    try {
      // This would typically call your n8n webhook endpoint
      // For now, we'll log the activity and simulate the call
      
      const n8nEndpoint = `${process.env.N8N_WEBHOOK_URL}/${workflowType}`;
      
      const response = await fetch(n8nEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.N8N_API_KEY}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`n8n workflow failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ n8n workflow triggered successfully:', result);
      return result;

    } catch (error) {
      console.error('💥 Error triggering n8n workflow:', error);
      
      // Log failed n8n trigger
      await WebhookMonitoringService.logWebhookActivity({
        merchant_id: data.merchantId,
        webhook_type: `n8n_${workflowType}`,
        source: 'n8n',
        status: 'failed',
        payload: data,
        error_message: error instanceof Error ? error.message : 'Unknown error'
      });

      throw error;
    }
  }

  static async verifyShopifyWebhook(body: string, signature: string, secret: string): Promise<boolean> {
    try {
      const crypto = await import('crypto');
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(body, 'utf8');
      const calculatedSignature = hmac.digest('base64');
      
      return calculatedSignature === signature;
    } catch (error) {
      console.error('💥 Error verifying Shopify webhook signature:', error);
      return false;
    }
  }
}
