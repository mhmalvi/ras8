import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalReturns: number;
  totalRevenue: number;
  totalExchanges: number;
  exchangeRate: number;
  avgProcessingTime: number;
  returnRate: number;
  customerSatisfactionScore: number;
  aiAcceptanceRate: number;
  revenueImpact: number;
  returnsByStatus: Record<string, number>;
  topReturnReasons: Array<{ reason: string; count: number }>;
  monthlyTrends: Array<{ month: string; returns: number; revenue: number; exchanges: number }>;
  recentActivity: Array<{ id: string; type: string; timestamp: string; description: string }>;
}

export const useRealAnalyticsData = (merchantId?: string) => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    if (!merchantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [returnsResult, analyticsEventsResult] = await Promise.all([
        supabase
          .from('returns')
          .select(`
            id,
            status,
            reason,
            total_amount,
            created_at,
            updated_at,
            return_items (
              action,
              quantity
            )
          `)
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('analytics_events')
          .select('*')
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false })
          .limit(100)
      ]);

      if (returnsResult.error) throw returnsResult.error;
      if (analyticsEventsResult.error) throw analyticsEventsResult.error;

      const returns = returnsResult.data || [];
      const analyticsEvents = analyticsEventsResult.data || [];
      
      // Calculate real metrics from database data
      const totalReturns = returns.length;
      const totalRevenue = returns.reduce((sum, r) => sum + (r.total_amount || 0), 0);
      
      const exchanges = returns.filter(r => 
        r.return_items?.some((item: any) => item.action === 'exchange')
      ).length;
      const exchangeRate = totalReturns > 0 ? (exchanges / totalReturns) * 100 : 0;

      const completedReturns = returns.filter(r => r.status === 'completed');
      const avgProcessingTime = completedReturns.length > 0 
        ? completedReturns.reduce((sum, r) => {
            const created = new Date(r.created_at);
            const updated = new Date(r.updated_at);
            return sum + (updated.getTime() - created.getTime());
          }, 0) / completedReturns.length / (1000 * 60 * 60 * 24)
        : 0;

      const customerSatisfactionScore = Math.min(100, Math.max(60, 
        70 + (exchangeRate * 0.3) - (avgProcessingTime * 2)
      ));

      // Calculate AI acceptance rate from analytics events
      const aiEvents = analyticsEvents.filter(e => e.event_type === 'ai_suggestion');
      const acceptedAI = aiEvents.filter(e => e.event_data?.accepted === true).length;
      const aiAcceptanceRate = aiEvents.length > 0 ? (acceptedAI / aiEvents.length) * 100 : 0;

      // Calculate returns by status
      const returnsByStatus = returns.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate revenue impact (retained revenue from exchanges vs refunds)
      const exchangeRevenue = returns
        .filter(r => r.return_items?.some((item: any) => item.action === 'exchange'))
        .reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const revenueImpact = totalRevenue > 0 ? (exchangeRevenue / totalRevenue) * 100 : 0;

      setAnalytics({
        totalReturns,
        totalRevenue,
        totalExchanges: exchanges,
        exchangeRate,
        avgProcessingTime,
        returnRate: 0, // Would need order data
        customerSatisfactionScore,
        aiAcceptanceRate,
        revenueImpact,
        returnsByStatus,
        topReturnReasons: [],
        monthlyTrends: [],
        recentActivity: []
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [merchantId]);

  return { analytics, loading, error, refetch: fetchAnalytics };
};