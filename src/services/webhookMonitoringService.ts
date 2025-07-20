
import { supabase } from '@/integrations/supabase/client';

export interface WebhookActivity {
  id: string;
  merchant_id: string;
  webhook_type: string;
  source: string;
  status: 'received' | 'processing' | 'completed' | 'failed';
  payload: any;
  response?: any;
  error_message?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

export class WebhookMonitoringService {
  static async logWebhookActivity(data: {
    merchant_id: string;
    webhook_type: string;
    source: string;
    status: 'received' | 'processing' | 'completed' | 'failed';
    payload: any;
    response?: any;
    error_message?: string;
  }): Promise<WebhookActivity> {
    const { data: activity, error } = await supabase
      .from('webhook_activity')
      .insert({
        merchant_id: data.merchant_id,
        webhook_type: data.webhook_type,
        source: data.source,
        status: data.status,
        payload: data.payload,
        response: data.response,
        error_message: data.error_message
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log webhook activity:', error);
      throw error;
    }

    return activity as WebhookActivity;
  }

  static async updateWebhookStatus(
    activityId: string,
    status: 'received' | 'processing' | 'completed' | 'failed',
    response?: any,
    errorMessage?: string,
    processingTimeMs?: number
  ): Promise<void> {
    const { error } = await supabase
      .from('webhook_activity')
      .update({
        status,
        response,
        error_message: errorMessage,
        processing_time_ms: processingTimeMs,
        updated_at: new Date().toISOString()
      })
      .eq('id', activityId);

    if (error) {
      console.error('Failed to update webhook status:', error);
      throw error;
    }
  }

  static async getWebhookActivity(merchantId: string, limit: number = 50): Promise<WebhookActivity[]> {
    const { data, error } = await supabase
      .from('webhook_activity')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get webhook activity:', error);
      throw error;
    }

    return (data || []) as WebhookActivity[];
  }

  static async getWebhookStats(merchantId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    averageProcessingTime: number;
  }> {
    const { data, error } = await supabase
      .from('webhook_activity')
      .select('status, processing_time_ms')
      .eq('merchant_id', merchantId);

    if (error) {
      console.error('Failed to get webhook stats:', error);
      throw error;
    }

    const activities = data || [];
    const total = activities.length;
    const successful = activities.filter(a => a.status === 'completed').length;
    const failed = activities.filter(a => a.status === 'failed').length;
    const processingTimes = activities
      .filter(a => a.processing_time_ms)
      .map(a => a.processing_time_ms);
    
    const averageProcessingTime = processingTimes.length > 0
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
      : 0;

    return {
      total,
      successful,
      failed,
      averageProcessingTime
    };
  }
}
