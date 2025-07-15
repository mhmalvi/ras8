
import { useState, useEffect } from 'react';
import { WebhookMonitoringService, type WebhookActivity } from '@/services/webhookMonitoringService';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { supabase } from '@/integrations/supabase/client';

export const useWebhookMonitoring = () => {
  const { profile } = useMerchantProfile();
  const [activities, setActivities] = useState<WebhookActivity[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    successful: number;
    failed: number;
    averageProcessingTime: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const merchantId = profile?.merchant_id;

  const loadWebhookData = async () => {
    if (!merchantId) {
      setActivities([]);
      setStats(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load webhook activities and stats in parallel
      const [activitiesData, statsData] = await Promise.all([
        WebhookMonitoringService.getWebhookActivity(merchantId),
        WebhookMonitoringService.getWebhookStats(merchantId)
      ]);

      setActivities(activitiesData);
      setStats(statsData);

    } catch (err) {
      console.error('Failed to load webhook data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load webhook data');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription for webhook activities
  useEffect(() => {
    if (!merchantId) return;

    const channel = supabase
      .channel(`webhook-activity-${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'webhook_activity',
          filter: `merchant_id=eq.${merchantId}`
        },
        () => {
          console.log('🔄 Webhook activity changed, refreshing data...');
          loadWebhookData();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [merchantId]);

  // Load initial data
  useEffect(() => {
    loadWebhookData();
  }, [merchantId]);

  return {
    activities,
    stats,
    loading,
    error,
    refetch: loadWebhookData
  };
};
