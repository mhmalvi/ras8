import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';

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
  const { profile } = useMerchantProfile();
  const [stats, setStats] = useState<MasterAdminStats | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    // SECURITY FIX: Only allow system admins to access master admin data
    if (profile?.role !== 'master_admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      console.log('🔄 Fetching master admin stats...');
      
      // SECURITY FIX: Even admins should have scoped access in most cases
      const { data: merchantsData, error: merchantsError } = await supabase
        .from('merchants')
        .select('id, shop_domain, plan_type, created_at')  // Limit fields
        .order('created_at', { ascending: false })
        .limit(100);  // Add reasonable limits

      if (merchantsError) throw merchantsError;

      // SECURITY FIX: Limit returns data access for admins
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('total_amount, created_at, merchant_id')
        .order('created_at', { ascending: false })
        .limit(1000);  // Add reasonable limits

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
    // SECURITY FIX: Only allow system admins to access merchant data
    if (profile?.role !== 'master_admin') {
      throw new Error('Unauthorized: Admin access required');
    }

    try {
      console.log('🔄 Fetching merchants with returns data...');
      
      // SECURITY FIX: Limit merchant data fields and scope
      const { data: merchantsData, error: merchantsError } = await supabase
        .from('merchants')
        .select('id, shop_domain, plan_type, created_at, updated_at')
        .order('created_at', { ascending: false })
        .limit(50);  // Reasonable limit for admin view

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
    try {
      console.log('🔄 Fetching real system health data...');
      
      const { data, error } = await supabase.functions.invoke('system-health-check');

      if (error) {
        console.error('❌ Error fetching system health:', error);
        // Fallback to indicate service unavailable
        setSystemHealth({
          database: {
            status: 'error',
            responseTime: 'N/A',
            uptime: 'N/A'
          },
          apiServices: {
            status: 'error',
            responseTime: 'N/A', 
            uptime: 'N/A'
          },
          aiServices: {
            status: 'error',
            responseTime: 'N/A',
            uptime: 'N/A'
          }
        });
        return;
      }

      setSystemHealth(data);
      console.log('✅ System health data fetched:', data);
    } catch (err) {
      console.error('❌ Error in fetchSystemHealth:', err);
      // Set error state if health check fails
      setSystemHealth({
        database: { status: 'error', responseTime: 'N/A', uptime: 'N/A' },
        apiServices: { status: 'error', responseTime: 'N/A', uptime: 'N/A' },
        aiServices: { status: 'error', responseTime: 'N/A', uptime: 'N/A' }
      });
    }
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
    // Only fetch data if user is authenticated and has admin role
    if (profile?.role === 'master_admin') {
      refreshData();
    } else if (profile && profile.role !== 'master_admin') {
      setError('Access denied: Admin privileges required');
      setLoading(false);
    }
  }, [profile]);

  return {
    stats,
    merchants,
    systemHealth,
    loading,
    error,
    refreshData
  };
};