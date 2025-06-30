
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

// Hook for analytics data
export const useAnalyticsData = () => {
  const [analytics, setAnalytics] = useState<any>({
    totalReturns: 0,
    exchangeRate: 0,
    avgProcessingTime: 0,
    topReasons: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch returns data for analytics
      const { data: returnsData, error: returnsError } = await supabase
        .from('returns')
        .select('*');

      if (returnsError) throw returnsError;

      // Calculate analytics from the data
      const totalReturns = returnsData?.length || 0;
      const exchangeRequests = returnsData?.filter(r => r.status === 'approved').length || 0;
      const exchangeRate = totalReturns > 0 ? (exchangeRequests / totalReturns) * 100 : 0;

      // Calculate top reasons
      const reasonCounts = returnsData?.reduce((acc: any, curr: any) => {
        acc[curr.reason] = (acc[curr.reason] || 0) + 1;
        return acc;
      }, {}) || {};

      const topReasons = Object.entries(reasonCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([reason, count]) => ({ reason, count }));

      setAnalytics({
        totalReturns,
        exchangeRate: Math.round(exchangeRate),
        avgProcessingTime: 2.5, // Mock for now
        topReasons
      });
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to fetch analytics data');
      
      // Fallback to mock data
      setAnalytics({
        totalReturns: 4,
        exchangeRate: 75,
        avgProcessingTime: 2.5,
        topReasons: [
          { reason: "Wrong size", count: 2 },
          { reason: "Defective item", count: 1 },
          { reason: "Not as described", count: 1 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const refetch = () => {
    fetchAnalytics();
  };

  return {
    analytics,
    loading,
    error,
    refetch
  };
};
