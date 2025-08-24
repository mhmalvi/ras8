import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';

interface DashboardMetrics {
  totalMerchants: number;
  activeMerchants: number;
  totalReturns: number;
  totalRevenue: number;
  systemHealth: {
    database: string;
    api: string;
    ai: string;
    uptime: number;
  };
  monthlyGrowth: {
    merchants: number;
    returns: number;
    revenue: number;
  };
}

export const useRealDashboardMetrics = () => {
  const { profile } = useMerchantProfile();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    const merchantId = profile?.merchant_id;

    if (!merchantId) {
      setError('No merchant context available');
      setLoading(false);
      return;
    }

    try {
      // SECURITY FIX: Add merchant_id filtering to ALL queries
      const [merchantsResult, returnsResult, systemHealthResult] = await Promise.all([
        supabase.from('merchants').select('id, created_at, plan_type').eq('id', merchantId).order('created_at', { ascending: false }),
        supabase.from('returns').select('id, total_amount, created_at, merchant_id').eq('merchant_id', merchantId).order('created_at', { ascending: false }),
        supabase.functions.invoke('system-health-check')
      ]);

      if (merchantsResult.error) throw merchantsResult.error;
      if (returnsResult.error) throw returnsResult.error;

      const merchants = merchantsResult.data || [];
      const returns = returnsResult.data || [];

      // Calculate current month and previous month for growth metrics
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Calculate totals
      const totalMerchants = merchants.length;
      const activeMerchants = merchants.filter(m => {
        const lastActivity = new Date(m.created_at);
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return lastActivity > thirtyDaysAgo;
      }).length;

      const totalReturns = returns.length;
      const totalRevenue = returns.reduce((sum, r) => sum + (r.total_amount || 0), 0);

      // Calculate monthly growth
      const currentMonthMerchants = merchants.filter(m => new Date(m.created_at) >= currentMonthStart).length;
      const previousMonthMerchants = merchants.filter(m => {
        const created = new Date(m.created_at);
        return created >= previousMonthStart && created <= previousMonthEnd;
      }).length;

      const currentMonthReturns = returns.filter(r => new Date(r.created_at) >= currentMonthStart).length;
      const previousMonthReturns = returns.filter(r => {
        const created = new Date(r.created_at);
        return created >= previousMonthStart && created <= previousMonthEnd;
      }).length;

      const currentMonthRevenue = returns
        .filter(r => new Date(r.created_at) >= currentMonthStart)
        .reduce((sum, r) => sum + (r.total_amount || 0), 0);
      const previousMonthRevenue = returns
        .filter(r => {
          const created = new Date(r.created_at);
          return created >= previousMonthStart && created <= previousMonthEnd;
        })
        .reduce((sum, r) => sum + (r.total_amount || 0), 0);

      // Calculate growth percentages
      const merchantGrowth = previousMonthMerchants > 0 
        ? ((currentMonthMerchants - previousMonthMerchants) / previousMonthMerchants) * 100 
        : 0;
      const returnGrowth = previousMonthReturns > 0 
        ? ((currentMonthReturns - previousMonthReturns) / previousMonthReturns) * 100 
        : 0;
      const revenueGrowth = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : 0;

      // Process system health
      let systemHealth = {
        database: 'healthy',
        api: 'healthy',
        ai: 'healthy',
        uptime: 99.9
      };

      if (systemHealthResult.data) {
        const health = systemHealthResult.data;
        systemHealth = {
          database: health.database?.status || 'unknown',
          api: health.apiServices?.status || 'unknown',
          ai: health.aiServices?.status || 'unknown',
          uptime: parseFloat(health.database?.uptime?.replace('%', '') || '0')
        };
      }

      const dashboardMetrics: DashboardMetrics = {
        totalMerchants,
        activeMerchants,
        totalReturns,
        totalRevenue,
        systemHealth,
        monthlyGrowth: {
          merchants: merchantGrowth,
          returns: returnGrowth,
          revenue: revenueGrowth
        }
      };

      setMetrics(dashboardMetrics);
    } catch (err) {
      console.error('Error fetching dashboard metrics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.merchant_id) {
      fetchMetrics();
    }
    
    // Set up real-time updates for key tables
    const channel = supabase
      .channel(`dashboard-metrics-${profile?.merchant_id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'merchants' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'returns' }, fetchMetrics)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.merchant_id]);

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  };
};