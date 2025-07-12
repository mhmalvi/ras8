
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

  // Load ONLY merchant-specific webhooks from database
  const loadWebhooks = async () => {
    if (!profile?.merchant_id) {
      console.warn('⚠️ No merchant_id available for webhook loading');
      return;
    }

    try {
      console.log(`🔍 Loading webhooks for merchant: ${profile.merchant_id}`);
      
      const { data: webhookData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'webhook_configured')
        .eq('merchant_id', profile.merchant_id) // CRITICAL: Only load this merchant's webhooks
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading merchant webhooks:', error);
        throw error;
      }

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
          merchantId: profile.merchant_id // Ensure merchant isolation
        };
      }) || [];

      console.log(`✅ Loaded ${formattedWebhooks.length} webhooks for merchant ${profile.merchant_id}`);
      setWebhooks(formattedWebhooks);
    } catch (error) {
      console.error('💥 Error loading merchant-specific webhooks:', error);
      toast({
        title: "Error",
        description: "Failed to load your webhook configurations",
        variant: "destructive",
      });
    }
  };

  // Load ONLY merchant-specific activities from database
  const loadActivities = async () => {
    if (!profile?.merchant_id) {
      console.warn('⚠️ No merchant_id available for activity loading');
      return;
    }

    try {
      console.log(`🔍 Loading webhook activities for merchant: ${profile.merchant_id}`);
      
      const { data: activityData, error } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('event_type', 'webhook_triggered')
        .eq('merchant_id', profile.merchant_id) // CRITICAL: Only load this merchant's activities
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('❌ Error loading merchant activities:', error);
        throw error;
      }

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
          merchantId: profile.merchant_id // Ensure merchant isolation
        };
      }) || [];

      console.log(`✅ Loaded ${formattedActivities.length} activities for merchant ${profile.merchant_id}`);
      setActivities(formattedActivities);
    } catch (error) {
      console.error('💥 Error loading merchant-specific activities:', error);
    }
  };

  // Create new webhook with STRICT merchant isolation
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
      console.log(`🔧 Creating webhook for merchant: ${profile.merchant_id}`);
      
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: 'webhook_configured',
          merchant_id: profile.merchant_id, // CRITICAL: Ensure merchant isolation
          event_data: {
            ...webhookData,
            status: 'active',
            merchantId: profile.merchant_id, // Double isolation
            createdAt: new Date().toISOString(),
            tenant_isolated: true // Flag for audit
          }
        });

      if (error) {
        console.error('❌ Error creating merchant webhook:', error);
        throw error;
      }

      await loadWebhooks();
      
      toast({
        title: "Webhook created",
        description: "Your webhook endpoint has been configured successfully.",
      });

      console.log(`✅ Webhook created successfully for merchant ${profile.merchant_id}`);
      return true;
    } catch (error) {
      console.error('💥 Error creating merchant webhook:', error);
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

  // Test webhook with merchant-specific context
  const testWebhook = async (webhook: WebhookEndpoint) => {
    if (!profile?.merchant_id || webhook.merchantId !== profile.merchant_id) {
      toast({
        title: "Error",
        description: "Unauthorized webhook access",
        variant: "destructive",
      });
      return false;
    }

    setLoading(true);
    try {
      console.log(`🧪 Testing webhook for merchant: ${profile.merchant_id}`);
      
      const result = await n8nService.testWebhookConnection(webhook.url, profile.merchant_id);
      
      // Log the test activity with STRICT merchant isolation
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'webhook_triggered',
          merchant_id: profile.merchant_id, // CRITICAL: Ensure merchant isolation
          event_data: {
            webhookId: webhook.id,
            status: result.success ? 'success' : 'error',
            payload: { 
              test: true, 
              merchantId: profile.merchant_id,
              tenant_isolated: true 
            },
            response: result.data,
            error: result.error,
            testTriggered: true,
            merchant_isolated: true // Flag for audit
          }
        });

      await loadActivities();

      if (result.success) {
        toast({
          title: "Test successful",
          description: "Your webhook test completed successfully.",
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
      console.error('💥 Error testing merchant webhook:', error);
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

  // Toggle webhook with merchant validation
  const toggleWebhook = async (webhookId: string, active: boolean) => {
    if (!profile?.merchant_id) return false;

    setLoading(true);
    try {
      console.log(`🔄 Toggling webhook ${webhookId} for merchant: ${profile.merchant_id}`);
      
      // Update with STRICT merchant validation
      const { error } = await supabase
        .from('analytics_events')
        .update({
          event_data: {
            active,
            status: active ? 'active' : 'inactive',
            merchantId: profile.merchant_id,
            updatedAt: new Date().toISOString(),
            tenant_isolated: true
          }
        })
        .eq('id', webhookId)
        .eq('merchant_id', profile.merchant_id) // CRITICAL: Double-check merchant ownership
        .eq('event_type', 'webhook_configured');

      if (error) {
        console.error('❌ Error toggling merchant webhook:', error);
        throw error;
      }

      // Update local state immediately
      setWebhooks(prev => 
        prev.map(webhook => 
          webhook.id === webhookId 
            ? { ...webhook, active, status: active ? 'active' : 'inactive' as const }
            : webhook
        )
      );

      toast({
        title: "Webhook updated",
        description: `Your webhook ${active ? 'activated' : 'deactivated'} successfully.`,
      });

      return true;
    } catch (error) {
      console.error('💥 Error toggling merchant webhook:', error);
      await loadWebhooks(); // Reload on error
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

  // Delete webhook with merchant validation
  const deleteWebhook = async (webhookId: string) => {
    if (!profile?.merchant_id) return false;

    setLoading(true);
    try {
      console.log(`🗑️ Deleting webhook ${webhookId} for merchant: ${profile.merchant_id}`);
      
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .eq('id', webhookId)
        .eq('merchant_id', profile.merchant_id) // CRITICAL: Only delete own webhooks
        .eq('event_type', 'webhook_configured');

      if (error) {
        console.error('❌ Error deleting merchant webhook:', error);
        throw error;
      }

      // Remove from local state
      setWebhooks(prev => prev.filter(w => w.id !== webhookId));
      setActivities(prev => prev.filter(a => a.webhookId !== webhookId));

      toast({
        title: "Webhook deleted",
        description: "Your webhook has been removed successfully.",
      });

      return true;
    } catch (error) {
      console.error('💥 Error deleting merchant webhook:', error);
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

  // Load data when merchant_id becomes available
  useEffect(() => {
    if (profile?.merchant_id) {
      console.log(`🚀 Initializing webhook manager for merchant: ${profile.merchant_id}`);
      loadWebhooks();
      loadActivities();
    } else {
      console.warn('⚠️ No merchant_id available, clearing webhook data');
      setWebhooks([]);
      setActivities([]);
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
