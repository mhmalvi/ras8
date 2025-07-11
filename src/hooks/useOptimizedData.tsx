
import { useState, useMemo, useCallback, useEffect } from 'react';
import { OptimizedQueryService } from '@/utils/optimizedQueryService';
import { EdgeFunctionOptimizer } from '@/utils/edgeFunctionOptimizer';
import { useProfile } from './useProfile';

export const useOptimizedReturns = (options: {
  limit?: number;
  status?: string;
  autoRefresh?: boolean;
} = {}) => {
  const { profile } = useProfile();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!profile?.merchant_id) return;

    try {
      setLoading(true);
      setError(null);
      
      const returns = await OptimizedQueryService.getOptimizedReturns(
        profile.merchant_id,
        {
          limit: options.limit || 50,
          status: options.status
        }
      );
      
      setData(returns || []);
    } catch (err) {
      console.error('Error fetching optimized returns:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [profile?.merchant_id, options.limit, options.status]);

  // Memoize the fetch function to prevent unnecessary re-renders
  const memoizedFetch = useMemo(() => fetchData, [fetchData]);

  // Auto-refresh functionality
  useEffect(() => {
    memoizedFetch();
    
    if (options.autoRefresh) {
      const interval = setInterval(memoizedFetch, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [memoizedFetch, options.autoRefresh]);

  return {
    data,
    loading,
    error,
    refetch: memoizedFetch
  };
};

export const useOptimizedAnalytics = (timeRange: 'week' | 'month' | 'quarter' = 'month') => {
  const { profile } = useProfile();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!profile?.merchant_id) return;

    try {
      setLoading(true);
      setError(null);
      
      const analytics = await OptimizedQueryService.getOptimizedAnalytics(
        profile.merchant_id,
        timeRange
      );
      
      setData(analytics);
    } catch (err) {
      console.error('Error fetching optimized analytics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [profile?.merchant_id, timeRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refetch: fetchAnalytics
  };
};

export const useOptimizedAI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendation = useCallback(async (returnData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await EdgeFunctionOptimizer.invokeOptimized(
        'generate-exchange-recommendation',
        { returnData },
        { 
          cacheEnabled: true,
          cacheDuration: 600000, // Cache for 10 minutes
          maxRetries: 2
        }
      );
      
      if (!result.success) {
        throw new Error(result.error || 'AI recommendation failed');
      }
      
      return result.data;
    } catch (err) {
      console.error('Error generating AI recommendation:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const generateInsights = useCallback(async (analyticsData: any) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await EdgeFunctionOptimizer.invokeOptimized(
        'generate-analytics-insights',
        { analyticsData },
        { 
          cacheEnabled: true,
          cacheDuration: 900000, // Cache for 15 minutes
          maxRetries: 2
        }
      );
      
      if (!result.success) {
        throw new Error(result.error || 'AI insights failed');
      }
      
      return result.data;
    } catch (err) {
      console.error('Error generating AI insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generateRecommendation,
    generateInsights
  };
};
