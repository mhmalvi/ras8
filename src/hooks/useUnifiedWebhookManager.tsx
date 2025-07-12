
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { UnifiedWebhookService } from '@/services/unifiedWebhookService';

interface MerchantWebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  lastTriggered?: string;
  status: 'active' | 'inactive' | 'error';
  method: 'POST' | 'GET';
  headers?: Record<string, string>;
  merchantId: string;
}

interface MerchantWebhookActivity {
  id: string;
  webhookId: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  payload: any;
  response?: any;
  error?: string;
  merchantId: string;
  testType?: 'server_side' | 'browser_based';
}

interface WebhookTestOptions {
  preferServerSide?: boolean;
  fallbackToBrowser?: boolean;
  testType?: 'server_side' | 'browser_based' | 'both';
}

export const useUnifiedWebhookManager = () => {
  const { merchant } = useMerchantProfile();
  const [webhooks, setWebhooks] = useState<MerchantWebhookEndpoint[]>([]);
  const [activities, setActivities] = useState<MerchantWebhookActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [testOptions, setTestOptions] = useState<WebhookTestOptions>({
    preferServerSide: true,
    fallbackToBrowser: true,
    testType: 'both'
  });
  const { toast } = useToast();

  const merchantId = merchant?.id;

  const loadMerchantWebhooks = useCallback(async () => {
    if (!merchantId) {
      console.log('⚠️ No merchant ID, skipping webhook load');
      setWebhooks([]);
      return;
    }

    console.log('🔗 Loading merchant-specific webhooks for:', merchantId);
    
    try {
      const { data: webhookData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'webhook_endpoint')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const merchantWebhooks: MerchantWebhookEndpoint[] = webhookData?.map(item => {
        const eventData = item.event_data as any;
        return {
          id: item.id,
          name: eventData.name || 'Unnamed Webhook',
          url: eventData.url || '',
          events: eventData.events || [],
          active: eventData.active ?? true,
          lastTriggered: eventData.last_triggered,
          status: eventData.status || 'inactive',
          method: eventData.method || 'POST',
          headers: eventData.headers || {},
          merchantId: merchantId
        };
      }) || [];

      console.log(`✅ Loaded ${merchantWebhooks.length} merchant-specific webhooks`);
      setWebhooks(merchantWebhooks);

    } catch (error) {
      console.error('💥 Failed to load merchant webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to load your webhook endpoints",
        variant: "destructive",
      });
    }
  }, [merchantId, toast]);

  const loadMerchantActivity = useCallback(async () => {
    if (!merchantId) {
      setActivities([]);
      return;
    }

    console.log('📊 Loading merchant-specific webhook activity for:', merchantId);

    try {
      const { data: activityData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'webhook_triggered')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const merchantActivities: MerchantWebhookActivity[] = activityData?.map(item => {
        const eventData = item.event_data as any;
        return {
          id: item.id,
          webhookId: eventData.webhook_id || 'unknown',
          timestamp: item.created_at,
          status: eventData.success ? 'success' : 'error',
          payload: eventData.payload || {},
          response: eventData.response,
          error: eventData.error,
          merchantId: merchantId,
          testType: eventData.test_type || 'unknown'
        };
      }) || [];

      console.log(`✅ Loaded ${merchantActivities.length} merchant-specific activities`);
      setActivities(merchantActivities);

    } catch (error) {
      console.error('💥 Failed to load merchant webhook activity:', error);
    }
  }, [merchantId]);

  const createMerchantWebhook = async (webhookData: {
    name: string;
    url: string;
    events: string[];
    active: boolean;
    method: 'POST' | 'GET';
    headers?: Record<string, string>;
  }) => {
    if (!merchantId) {
      toast({
        title: "Error",
        description: "No merchant context available",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    
    try {
      console.log('🆕 Creating merchant-specific webhook for:', merchantId);

      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'webhook_endpoint',
          merchant_id: merchantId,
          event_data: {
            ...webhookData,
            merchant_id: merchantId,
            created_at: new Date().toISOString(),
            status: 'active'
          }
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webhook endpoint created successfully",
      });

      await loadMerchantWebhooks();
      return true;

    } catch (error) {
      console.error('💥 Failed to create merchant webhook:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook endpoint",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const testMerchantWebhook = async (webhook: MerchantWebhookEndpoint, options?: WebhookTestOptions) => {
    if (!merchantId || webhook.merchantId !== merchantId) {
      toast({
        title: "Error",
        description: "Invalid merchant context for webhook test",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log(`🧪 Testing webhook via unified service: ${webhook.id} for merchant: ${merchantId}`);

      const finalOptions = { ...testOptions, ...options };
      
      const result = await UnifiedWebhookService.testWebhook(
        merchantId,
        webhook.url,
        {
          ...finalOptions,
          testPayload: {
            webhook_id: webhook.id,
            webhook_name: webhook.name,
            test_timestamp: new Date().toISOString(),
            merchant_specific: true,
            test_method: finalOptions.testType || 'unified'
          }
        }
      );

      // Log the test activity
      await supabase.from('analytics_events').insert({
        event_type: 'webhook_triggered',
        merchant_id: merchantId,
        event_data: {
          webhook_id: webhook.id,
          webhook_url: webhook.url,
          test_type: result.testType,
          success: result.success,
          status: result.status,
          error: result.error,
          response_data: result.data,
          merchant_isolated: true,
          tenant_specific: true,
          payload_size: result.payloadSize || 0,
          test_method: 'unified_service'
        }
      });

      await loadMerchantActivity();

      if (result.success) {
        toast({
          title: "Test successful",
          description: `Webhook test completed via ${result.testType} (Status: ${result.status})`,
        });
      } else {
        toast({
          title: "Test failed",
          description: `Webhook test failed via ${result.testType}: ${result.error}`,
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('💥 Unified webhook test failed:', error);
      toast({
        title: "Test failed",
        description: "Unable to test webhook endpoint",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMerchantWebhook = async (webhookId: string, active: boolean) => {
    if (!merchantId) return;

    try {
      const { data: currentWebhook, error: fetchError } = await supabase
        .from('analytics_events')
        .select('event_data')
        .eq('id', webhookId)
        .eq('merchant_id', merchantId)
        .single();

      if (fetchError) throw fetchError;

      const updatedEventData = {
        ...(currentWebhook.event_data as any),
        active: active
      };

      const { error } = await supabase
        .from('analytics_events')
        .update({
          event_data: updatedEventData
        })
        .eq('id', webhookId)
        .eq('merchant_id', merchantId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Webhook ${active ? 'enabled' : 'disabled'}`,
      });

      await loadMerchantWebhooks();

    } catch (error) {
      console.error('💥 Failed to toggle merchant webhook:', error);
      toast({
        title: "Error",
        description: "Failed to update webhook status",
        variant: "destructive",
      });
    }
  };

  const deleteMerchantWebhook = async (webhookId: string) => {
    if (!merchantId) return;

    try {
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .eq('id', webhookId)
        .eq('merchant_id', merchantId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Webhook endpoint deleted",
      });

      await loadMerchantWebhooks();

    } catch (error) {
      console.error('💥 Failed to delete merchant webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook endpoint",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (merchantId) {
      loadMerchantWebhooks();
      loadMerchantActivity();
    } else {
      setWebhooks([]);
      setActivities([]);
    }
  }, [merchantId, loadMerchantWebhooks, loadMerchantActivity]);

  return {
    webhooks,
    activities,
    loading,
    testOptions,
    setTestOptions,
    createWebhook: createMerchantWebhook,
    testWebhook: testMerchantWebhook,
    toggleWebhook: toggleMerchantWebhook,
    deleteWebhook: deleteMerchantWebhook,
    refetchWebhooks: loadMerchantWebhooks,
    refetchActivity: loadMerchantActivity,
    merchantId
  };
};
