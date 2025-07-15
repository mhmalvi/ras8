import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MasterAdminStats {
  totalMerchants: number;
  totalReturns: number;
  totalRevenue: number;
  activeMerchants: number;
  monthlyGrowth: {
    merchants: number;
    returns: number;
    revenue: number;
  };
}

interface Merchant {
  id: string;
  shop_domain: string;
  plan_type: string;
  created_at: string;
  updated_at: string;
  returnsCount?: number;
  totalRevenue?: number;
}

interface SystemHealth {
  database: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: string;
    uptime: string;
  };
  apiServices: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: string;
    uptime: string;
  };
  aiServices: {
    status: 'healthy' | 'warning' | 'error';
    responseTime: string;
    uptime: string;
  };
}

export const useMasterAdminData = () => {
  const [stats, setStats] = useState<MasterAdminStats | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      console.log('🔄 Fetching master admin stats...');
      
      // Get total merchants
      const { data: merchantsData, error: merchantsError } = await supabase
        .from('merchants')
        .select('*');

      if (merchantsError) throw merchantsError;

      // Get total returns
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('total_amount, created_at');

      if (returnsError) throw returnsError;

      // Calculate stats
      const totalMerchants = merchantsData?.length || 0;
      const totalReturns = returnsData?.length || 0;
      const totalRevenue = returnsData?.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0;
      
      // Calculate monthly growth (simplified)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const thisMonthReturns = returnsData?.filter(r => {
        const returnDate = new Date(r.created_at);
        return returnDate.getMonth() === currentMonth && returnDate.getFullYear() === currentYear;
      });

      const thisMonthMerchants = merchantsData?.filter(m => {
        const merchantDate = new Date(m.created_at);
        return merchantDate.getMonth() === currentMonth && merchantDate.getFullYear() === currentYear;
      });

      setStats({
        totalMerchants,
        totalReturns,
        totalRevenue,
        activeMerchants: totalMerchants, // Assuming all merchants are active for now
        monthlyGrowth: {
          merchants: thisMonthMerchants?.length || 0,
          returns: thisMonthReturns?.length || 0,
          revenue: thisMonthReturns?.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0,
        }
      });

      console.log('✅ Master admin stats fetched:', {
        totalMerchants,
        totalReturns,
        totalRevenue
      });

    } catch (err) {
      console.error('❌ Error fetching master admin stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
    }
  };

  const fetchMerchants = async () => {
    try {
      console.log('🔄 Fetching merchants with returns data...');
      
      const { data: merchantsData, error: merchantsError } = await supabase
        .from('merchants')
        .select('*');

      if (merchantsError) throw merchantsError;

      // Get returns count and revenue for each merchant
      const merchantsWithStats = await Promise.all(
        (merchantsData || []).map(async (merchant) => {
          const { data: returnsData, error: returnsError } = await supabase
            .from('returns')
            .select('total_amount')
            .eq('merchant_id', merchant.id);

          if (returnsError) {
            console.warn('Failed to fetch returns for merchant:', merchant.id, returnsError);
            return {
              ...merchant,
              returnsCount: 0,
              totalRevenue: 0
            };
          }

          const returnsCount = returnsData?.length || 0;
          const totalRevenue = returnsData?.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0) || 0;

          return {
            ...merchant,
            returnsCount,
            totalRevenue
          };
        })
      );

      setMerchants(merchantsWithStats);
      console.log('✅ Merchants with stats fetched:', merchantsWithStats);

    } catch (err) {
      console.error('❌ Error fetching merchants:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch merchants');
    }
  };

  const fetchSystemHealth = async () => {
    // For now, we'll simulate system health data
    // In a real implementation, this would query actual monitoring services
    setSystemHealth({
      database: {
        status: 'healthy',
        responseTime: '45ms',
        uptime: '99.9%'
      },
      apiServices: {
        status: 'healthy',
        responseTime: '120ms',
        uptime: '99.8%'
      },
      aiServices: {
        status: 'healthy',
        responseTime: '1.2s',
        uptime: '99.5%'
      }
    });
  };

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchStats(),
        fetchMerchants(),
        fetchSystemHealth()
      ]);
    } catch (err) {
      console.error('❌ Error refreshing master admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    stats,
    merchants,
    systemHealth,
    loading,
    error,
    refreshData
  };
};