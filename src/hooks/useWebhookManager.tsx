
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';
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
  merchantId?: string;
}

interface WebhookActivity {
  id: string;
  webhookId: string;
  timestamp: string;
  status: 'success' | 'error' | 'pending';
  payload: any;
  response?: any;
  error?: string;
}

export const useWebhookManager = () => {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [activities, setActivities] = useState<WebhookActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load webhooks from database
  const loadWebhooks = async () => {
    try {
      const { data: webhookData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'webhook_configured')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedWebhooks: WebhookEndpoint[] = webhookData?.map(item => ({
        id: item.id,
        name: item.event_data?.name || 'Unnamed Webhook',
        url: item.event_data?.url || '',
        events: item.event_data?.events || [],
        active: item.event_data?.active || false,
        status: item.event_data?.status || 'inactive',
        method: item.event_data?.method || 'POST',
        headers: item.event_data?.headers || {},
        lastTriggered: item.event_data?.lastTriggered,
        merchantId: item.merchant_id
      })) || [];

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

  // Load activities from database
  const loadActivities = async () => {
    try {
      const { data: activityData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'webhook_triggered')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedActivities: WebhookActivity[] = activityData?.map(item => ({
        id: item.id,
        webhookId: item.event_data?.webhookId || '',
        timestamp: item.created_at || new Date().toISOString(),
        status: item.event_data?.status || 'pending',
        payload: item.event_data?.payload || {},
        response: item.event_data?.response,
        error: item.event_data?.error
      })) || [];

      setActivities(formattedActivities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  // Create new webhook
  const createWebhook = async (webhookData: Omit<WebhookEndpoint, 'id' | 'status' | 'lastTriggered'>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'webhook_configured',
          event_data: {
            ...webhookData,
            status: 'active',
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

  // Test webhook
  const testWebhook = async (webhook: WebhookEndpoint) => {
    setLoading(true);
    try {
      const result = await n8nService.testWebhookConnection(webhook.url);
      
      // Log the test activity
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'webhook_triggered',
          event_data: {
            webhookId: webhook.id,
            status: result.success ? 'success' : 'error',
            payload: { test: true },
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

  // Toggle webhook status
  const toggleWebhook = async (webhookId: string, active: boolean) => {
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

      // Update in database
      const { error } = await supabase
        .from('analytics_events')
        .update({
          event_data: {
            active,
            status: active ? 'active' : 'inactive',
            updatedAt: new Date().toISOString()
          }
        })
        .eq('id', webhookId);

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

  // Delete webhook
  const deleteWebhook = async (webhookId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .eq('id', webhookId);

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
    loadWebhooks();
    loadActivities();
  }, []);

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
