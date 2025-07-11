import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

// Centralized live data fetching service
export const useLiveData = () => {
  const { profile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Live Dashboard KPIs
  const [dashboardKPIs, setDashboardKPIs] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    completedReturns: 0,
    totalRevenue: 0,
    aiAcceptanceRate: 0,
    avgProcessingTime: 0,
  });

  // Live Analytics Data
  const [analyticsData, setAnalyticsData] = useState({
    monthlyTrends: [],
    statusBreakdown: [],
    topReasons: [],
    revenueImpact: 0,
  });

  // Live AI Insights
  const [aiInsights, setAiInsights] = useState({
    totalSuggestions: 0,
    acceptedSuggestions: 0,
    averageConfidence: 0,
    topRecommendations: [],
  });

  const fetchLiveDashboardKPIs = async (merchantId: string) => {
    try {
      console.log('📊 Fetching live dashboard KPIs for merchant:', merchantId);
      
      // Get total returns count
      const { data: allReturns, error: returnsError } = await supabase
        .from('returns')
        .select('id, status, total_amount, created_at')
        .eq('merchant_id', merchantId);

      if (returnsError) throw returnsError;

      // Get AI suggestions data
      const { data: aiSuggestions, error: aiError } = await supabase
        .from('ai_suggestions')
        .select('accepted, confidence_score')
        .not('return_id', 'is', null);

      if (aiError) throw aiError;

      // Calculate KPIs
      const totalReturns = allReturns?.length || 0;
      const pendingReturns = allReturns?.filter(r => ['requested', 'pending'].includes(r.status)).length || 0;
      const completedReturns = allReturns?.filter(r => r.status === 'completed').length || 0;
      const totalRevenue = allReturns?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;
      
      // AI metrics
      const acceptedAI = aiSuggestions?.filter(ai => ai.accepted === true).length || 0;
      const totalAI = aiSuggestions?.length || 0;
      const aiAcceptanceRate = totalAI > 0 ? (acceptedAI / totalAI) * 100 : 0;

      // Calculate average processing time (mock for now - would need return processing timestamps)
      const avgProcessingTime = 2.5; // days

      setDashboardKPIs({
        totalReturns,
        pendingReturns,
        completedReturns,
        totalRevenue,
        aiAcceptanceRate,
        avgProcessingTime,
      });

      console.log('✅ Dashboard KPIs updated:', {
        totalReturns,
        pendingReturns,
        completedReturns,
        totalRevenue,
        aiAcceptanceRate,
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard KPIs:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    }
  };

  const fetchLiveAnalytics = async (merchantId: string) => {
    try {
      console.log('📈 Fetching live analytics for merchant:', merchantId);
      
      // Get returns with items for analytics
      const { data: returnsWithItems, error } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (*)
        `)
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate monthly trends (last 6 months)
      const now = new Date();
      const monthlyTrends = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthReturns = returnsWithItems?.filter(r => {
          const returnDate = new Date(r.created_at);
          return returnDate >= monthStart && returnDate <= monthEnd;
        }) || [];

        monthlyTrends.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          returns: monthReturns.length,
          revenue: monthReturns.reduce((sum, r) => sum + (r.total_amount || 0), 0),
        });
      }

      // Status breakdown
      const statusCounts = returnsWithItems?.reduce((acc, r) => {
        acc[r.status] = (acc[r.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
        status: status.replace('_', ' '),
        count,
        percentage: returnsWithItems ? (count / returnsWithItems.length) * 100 : 0,
      }));

      // Top return reasons
      const reasonCounts = returnsWithItems?.reduce((acc, r) => {
        acc[r.reason] = (acc[r.reason] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topReasons = Object.entries(reasonCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));

      setAnalyticsData({
        monthlyTrends,
        statusBreakdown,
        topReasons,
        revenueImpact: returnsWithItems?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0,
      });

      console.log('✅ Analytics data updated');
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data');
    }
  };

  const fetchLiveAIInsights = async (merchantId: string) => {
    try {
      console.log('🤖 Fetching live AI insights for merchant:', merchantId);
      
      // Get AI suggestions with return data
      const { data: aiData, error } = await supabase
        .from('ai_suggestions')
        .select(`
          *,
          returns!inner (merchant_id)
        `)
        .eq('returns.merchant_id', merchantId);

      if (error) throw error;

      const totalSuggestions = aiData?.length || 0;
      const acceptedSuggestions = aiData?.filter(ai => ai.accepted === true).length || 0;
      const averageConfidence = aiData?.length ? 
        aiData.reduce((sum, ai) => sum + ai.confidence_score, 0) / aiData.length * 100 : 0;

      // Top recommendations
      const productCounts = aiData?.reduce((acc, ai) => {
        if (ai.suggested_product_name) {
          acc[ai.suggested_product_name] = (acc[ai.suggested_product_name] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      const topRecommendations = Object.entries(productCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([product, count]) => ({ product, count }));

      setAiInsights({
        totalSuggestions,
        acceptedSuggestions,
        averageConfidence,
        topRecommendations,
      });

      console.log('✅ AI insights updated');
    } catch (error) {
      console.error('❌ Error fetching AI insights:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch AI insights');
    }
  };

  const refreshAllData = async () => {
    if (!profile?.merchant_id) {
      console.log('⏳ No merchant_id available, skipping data fetch');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await Promise.all([
        fetchLiveDashboardKPIs(profile.merchant_id),
        fetchLiveAnalytics(profile.merchant_id),
        fetchLiveAIInsights(profile.merchant_id),
      ]);
    } catch (error) {
      console.error('❌ Error refreshing all data:', error);
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when merchant changes
  useEffect(() => {
    refreshAllData();
  }, [profile?.merchant_id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile?.merchant_id) return;

    const channel = supabase
      .channel('live-data-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `merchant_id=eq.${profile.merchant_id}`
        },
        () => {
          console.log('📡 Real-time update received, refreshing data...');
          refreshAllData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.merchant_id]);

  return {
    loading,
    error,
    dashboardKPIs,
    analyticsData,
    aiInsights,
    refreshAllData,
  };
};