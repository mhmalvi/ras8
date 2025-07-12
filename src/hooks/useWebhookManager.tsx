
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';
import { n8nService } from '@/services/n8nService';

interface WebhookEndpoint {
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

interface WebhookActivity {
  id: string;
  webhookId: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  payload: any;
  response?: any;
  error?: string;
  merchantId: string;
}

export const useWebhookManager = () => {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [activities, setActivities] = useState<WebhookActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useProfile();

  // Load merchant-specific webhooks from database
  const loadWebhooks = async () => {
    if (!profile?.merchant_id) return;

    try {
      const { data: webhookData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'webhook_configured')
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedWebhooks: WebhookEndpoint[] = webhookData?.map(item => {
        const eventData = item.event_data as any;
        
        return {
          id: item.id,
          name: eventData?.name || 'Unnamed Webhook',
          url: eventData?.url || '',
          events: eventData?.events || [],
          active: eventData?.active || false,
          status: (eventData?.status as 'active' | 'inactive' | 'error') || 'inactive',
          method: (eventData?.method as 'POST' | 'GET') || 'POST',
          headers: eventData?.headers || {},
          lastTriggered: eventData?.lastTriggered,
          merchantId: profile.merchant_id
        };
      }) || [];

      setWebhooks(formattedWebhooks);
    } catch (error) {
      console.error('Error loading webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to load webhooks from database",
        variant: "destructive",
      });
    }
  };

  // Load merchant-specific activities from database
  const loadActivities = async () => {
    if (!profile?.merchant_id) return;

    try {
      const { data: activityData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'webhook_triggered')
        .eq('merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedActivities: WebhookActivity[] = activityData?.map(item => {
        const eventData = item.event_data as any;
        
        return {
          id: item.id,
          webhookId: eventData?.webhookId || '',
          timestamp: item.created_at || new Date().toISOString(),
          status: (eventData?.status as 'success' | 'error' | 'pending') || 'pending',
          payload: eventData?.payload || {},
          response: eventData?.response,
          error: eventData?.error,
          merchantId: profile.merchant_id
        };
      }) || [];

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  // Create new merchant-specific webhook
  const createWebhook = async (webhookData: Omit<WebhookEndpoint, 'id' | 'status' | 'lastTriggered' | 'merchantId'>) => {
    if (!profile?.merchant_id) {
      toast({
        title: "Error",
        description: "No merchant ID found. Please ensure you're logged in.",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'webhook_configured',
          merchant_id: profile.merchant_id,
          event_data: {
            ...webhookData,
            status: 'active',
            merchantId: profile.merchant_id,
            createdAt: new Date().toISOString()
          }
        });

      if (error) throw error;

      await loadWebhooks();
      
      toast({
        title: "Webhook created",
        description: "New webhook endpoint has been configured successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: "Error",
        description: "Failed to create webhook.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Test merchant-specific webhook
  const testWebhook = async (webhook: WebhookEndpoint) => {
    if (!profile?.merchant_id) return false;

    setLoading(true);
    try {
      const result = await n8nService.testWebhookConnection(webhook.url);
      
      // Log the test activity with merchant ID
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'webhook_triggered',
          merchant_id: profile.merchant_id,
          event_data: {
            webhookId: webhook.id,
            status: result.success ? 'success' : 'error',
            payload: { test: true, merchantId: profile.merchant_id },
            response: result.data,
            error: result.error,
            testTriggered: true
          }
        });

      await loadActivities();

      if (result.success) {
        toast({
          title: "Test successful",
          description: "Webhook test completed successfully.",
        });
      } else {
        toast({
          title: "Test failed",
          description: `Webhook test failed: ${result.error}`,
          variant: "destructive",
        });
      }

      return result.success;
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: "Test failed",
        description: "Failed to test webhook connection.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle merchant-specific webhook status
  const toggleWebhook = async (webhookId: string, active: boolean) => {
    if (!profile?.merchant_id) return false;

    setLoading(true);
    try {
      // Update in local state first for immediate feedback
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === webhookId 
            ? { ...webhook, active, status: active ? 'active' : 'inactive' as const }
            : webhook
        )
      );

      // Update in database with merchant validation
      const { error } = await supabase
        .from('analytics_events')
        .update({
          event_data: {
            active,
            status: active ? 'active' : 'inactive',
            merchantId: profile.merchant_id,
            updatedAt: new Date().toISOString()
          }
        })
        .eq('id', webhookId)
        .eq('merchant_id', profile.merchant_id); // Ensure only merchant's own webhooks are updated

      if (error) throw error;

      toast({
        title: "Webhook updated",
        description: `Webhook ${active ? 'activated' : 'deactivated'} successfully.`,
      });

      return true;
    } catch (error) {
      console.error('Error toggling webhook:', error);
      // Revert local state on error
      await loadWebhooks();
      toast({
        title: "Error",
        description: "Failed to update webhook status.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete merchant-specific webhook
  const deleteWebhook = async (webhookId: string) => {
    if (!profile?.merchant_id) return false;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .eq('id', webhookId)
        .eq('merchant_id', profile.merchant_id); // Ensure only merchant's own webhooks are deleted

      if (error) throw error;

      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      setActivities(prev => prev.filter(a => a.webhookId !== webhookId));

      toast({
        title: "Webhook deleted",
        description: "Webhook has been removed successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: "Error",
        description: "Failed to delete webhook.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.merchant_id) {
      loadWebhooks();
      loadActivities();
    }
  }, [profile?.merchant_id]);

  return {
    webhooks,
    activities,
    loading,
    createWebhook,
    testWebhook,
    toggleWebhook,
    deleteWebhook,
    loadWebhooks,
    loadActivities
  };
};
