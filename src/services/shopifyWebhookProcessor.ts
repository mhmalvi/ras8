
import { supabase } from '@/integrations/supabase/client';
import { WebhookMonitoringService } from './webhookMonitoringService';

export interface ShopifyWebhookPayload {
  id: number;
  name?: string;
  email?: string;
  customer?: {
    id: number;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  line_items?: Array<{
    id: number;
    product_id: number;
    variant_id?: number;
    name: string;
    quantity: number;
    price: string;
  }>;
  total_price?: string;
  order_number?: string;
  created_at?: string;
  updated_at?: string;
  financial_status?: string;
  fulfillment_status?: string;
}

export class ShopifyWebhookProcessor {
  static async processOrderCreated(payload: ShopifyWebhookPayload, merchantId: string) {
    const startTime = Date.now();
    let activityId: string | null = null;

    try {
      console.log('🛒 Processing order creation webhook:', payload.id);

      // Log webhook activity
      const activity = await WebhookMonitoringService.logWebhookActivity({
        merchant_id: merchantId,
        webhook_type: 'orders/create',
        source: 'shopify',
        status: 'processing',
        payload,
        response: null
      });
      activityId = activity.id;

      // Process order data
      const orderData = {
        shopify_order_id: payload.id.toString(),
        customer_email: payload.email || payload.customer?.email || 'unknown@example.com',
        total_amount: parseFloat(payload.total_price || '0'),
        status: 'completed'
      };

      // Insert order into database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .upsert(orderData, { 
          onConflict: 'shopify_order_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Process order items
      if (payload.line_items && Array.isArray(payload.line_items)) {
        const orderItems = payload.line_items.map((item) => ({
          order_id: order.id,
          product_id: item.product_id?.toString() || 'unknown',
          product_name: item.name || 'Unknown Product',
          quantity: item.quantity || 1,
          price: parseFloat(item.price || '0')
        }));

        // Delete existing items for this order and insert new ones
        await supabase
          .from('order_items')
          .delete()
          .eq('order_id', order.id);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Log analytics event
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchantId,
          event_type: 'order_created',
          event_data: {
            shopify_order_id: payload.id,
            order_value: parseFloat(payload.total_price || '0'),
            customer_email: orderData.customer_email,
            item_count: payload.line_items?.length || 0,
            processed_at: new Date().toISOString()
          }
        });

      const processingTime = Date.now() - startTime;
      await WebhookMonitoringService.updateWebhookStatus(
        activityId,
        'completed',
        { orderId: order.id, processingTimeMs: processingTime },
        undefined,
        processingTime
      );

      console.log('✅ Order webhook processed successfully in', processingTime, 'ms');
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

  static async processOrderUpdated(payload: ShopifyWebhookPayload, merchantId: string) {
    const startTime = Date.now();
    let activityId: string | null = null;

    try {
      console.log('📝 Processing order update webhook:', payload.id);

      // Log webhook activity
      const activity = await WebhookMonitoringService.logWebhookActivity({
        merchant_id: merchantId,
        webhook_type: 'orders/updated',
        source: 'shopify',
        status: 'processing',
        payload,
        response: null
      });
      activityId = activity.id;

      // Update existing order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          customer_email: payload.email || payload.customer?.email || 'unknown@example.com',
          total_amount: parseFloat(payload.total_price || '0'),
          status: payload.financial_status === 'paid' ? 'completed' : 'pending'
        })
        .eq('shopify_order_id', payload.id.toString())
        .select()
        .single();

      if (orderError) {
        // If order doesn't exist, create it
        if (orderError.code === 'PGRST116') {
          return await this.processOrderCreated(payload, merchantId);
        }
        throw orderError;
      }

      // Log analytics event
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchantId,
          event_type: 'order_updated',
          event_data: {
            shopify_order_id: payload.id,
            order_value: parseFloat(payload.total_price || '0'),
            financial_status: payload.financial_status,
            fulfillment_status: payload.fulfillment_status,
            updated_at: new Date().toISOString()
          }
        });

      const processingTime = Date.now() - startTime;
      await WebhookMonitoringService.updateWebhookStatus(
        activityId,
        'completed',
        { orderId: order.id, processingTimeMs: processingTime },
        undefined,
        processingTime
      );

      console.log('✅ Order update webhook processed successfully in', processingTime, 'ms');
      return { success: true, orderId: order.id };

    } catch (error) {
      console.error('💥 Error processing order update webhook:', error);
      
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

  static async processAppUninstalled(payload: any, merchantId: string) {
    const startTime = Date.now();
    let activityId: string | null = null;

    try {
      console.log('🗑️ Processing app uninstall webhook for merchant:', merchantId);

      // Log webhook activity
      const activity = await WebhookMonitoringService.logWebhookActivity({
        merchant_id: merchantId,
        webhook_type: 'app/uninstalled',
        source: 'shopify',
        status: 'processing',
        payload,
        response: null
      });
      activityId = activity.id;

      // Mark merchant as disconnected
      const { error: merchantError } = await supabase
        .from('merchants')
        .update({ 
          access_token: 'UNINSTALLED',
          updated_at: new Date().toISOString()
        })
        .eq('id', merchantId);

      if (merchantError) throw merchantError;

      // Log analytics event
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchantId,
          event_type: 'app_uninstalled',
          event_data: {
            uninstalled_at: new Date().toISOString(),
            shop_domain: payload.domain || 'unknown'
          }
        });

      const processingTime = Date.now() - startTime;
      await WebhookMonitoringService.updateWebhookStatus(
        activityId,
        'completed',
        { merchantId, processingTimeMs: processingTime },
        undefined,
        processingTime
      );

      console.log('✅ App uninstall webhook processed successfully in', processingTime, 'ms');
      return { success: true, merchantId };

    } catch (error) {
      console.error('💥 Error processing app uninstall webhook:', error);
      
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

  static async processCustomerDataRequest(payload: any, merchantId: string) {
    const startTime = Date.now();
    let activityId: string | null = null;

    try {
      console.log('📋 Processing customer data request webhook for merchant:', merchantId);

      // Log webhook activity
      const activity = await WebhookMonitoringService.logWebhookActivity({
        merchant_id: merchantId,
        webhook_type: 'customers/data_request',
        source: 'shopify',
        status: 'processing',
        payload,
        response: null
      });
      activityId = activity.id;

      // Log GDPR compliance event
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchantId,
          event_type: 'gdpr_data_request',
          event_data: {
            customer_id: payload.customer?.id,
            customer_email: payload.customer?.email,
            requested_at: new Date().toISOString(),
            shop_domain: payload.shop_domain
          }
        });

      const processingTime = Date.now() - startTime;
      await WebhookMonitoringService.updateWebhookStatus(
        activityId,
        'completed',
        { processingTimeMs: processingTime },
        undefined,
        processingTime
      );

      console.log('✅ Customer data request webhook processed successfully in', processingTime, 'ms');
      return { success: true };

    } catch (error) {
      console.error('💥 Error processing customer data request webhook:', error);
      
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
}
