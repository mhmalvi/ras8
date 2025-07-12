
import { supabase } from '@/integrations/supabase/client';

export interface WebhookActivity {
  id: string;
  merchant_id: string;
  webhook_type: string;
  source: 'shopify' | 'n8n' | 'internal';
  status: 'received' | 'processing' | 'completed' | 'failed';
  payload: any;
  response: any;
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

export class WebhookMonitoringService {
  static async logWebhookActivity(activity: Omit<WebhookActivity, 'id' | 'created_at' | 'updated_at'>) {
    console.log('📡 Logging webhook activity:', activity.webhook_type, activity.status);
    
    try {
      const { data, error } = await supabase
        .from('webhook_activity')
        .insert({
          ...activity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('💥 Error logging webhook activity:', error);
      throw error;
    }
  }

  static async updateWebhookStatus(
    activityId: string, 
    status: WebhookActivity['status'], 
    response?: any, 
    errorMessage?: string,
    processingTimeMs?: number
  ) {
    console.log('🔄 Updating webhook status:', activityId, status);
    
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (response) updateData.response = response;
      if (errorMessage) updateData.error_message = errorMessage;
      if (processingTimeMs) updateData.processing_time_ms = processingTimeMs;

      const { error } = await supabase
        .from('webhook_activity')
        .update(updateData)
        .eq('id', activityId);

      if (error) throw error;
      console.log('✅ Webhook status updated successfully');
    } catch (error) {
      console.error('💥 Error updating webhook status:', error);
      throw error;
    }
  }

  static async getWebhookActivity(merchantId: string, limit: number = 50) {
    console.log('📊 Fetching webhook activity for merchant:', merchantId);
    
    try {
      const { data, error } = await supabase
        .from('webhook_activity')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('💥 Error fetching webhook activity:', error);
      throw error;
    }
  }

  static async getWebhookStats(merchantId: string, timeframe: string = '24h') {
    console.log('📈 Calculating webhook stats for:', merchantId, timeframe);
    
    try {
      const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720; // 30d
      const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('webhook_activity')
        .select('status, webhook_type, processing_time_ms')
        .eq('merchant_id', merchantId)
        .gte('created_at', since);

      if (error) throw error;

      const activities = data || [];
      const total = activities.length;
      const successful = activities.filter(a => a.status === 'completed').length;
      const failed = activities.filter(a => a.status === 'failed').length;
      const avgProcessingTime = activities
        .filter(a => a.processing_time_ms)
        .reduce((sum, a) => sum + (a.processing_time_ms || 0), 0) / Math.max(1, activities.length);

      return {
        total,
        successful,
        failed,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
        avgProcessingTime: Math.round(avgProcessingTime),
        byType: activities.reduce((acc, a) => {
          acc[a.webhook_type] = (acc[a.webhook_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };
    } catch (error) {
      console.error('💥 Error calculating webhook stats:', error);
      throw error;
    }
  }
}
