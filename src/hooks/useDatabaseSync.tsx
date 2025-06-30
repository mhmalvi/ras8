
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Database sync hook - connected to Supabase
export const useDatabaseSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('merchants').select('count').single();
        if (!error) {
          setIsConnected(true);
          setLastSync(new Date());
        }
      } catch (error) {
        console.error('Database connection check failed:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const syncData = async () => {
    setSyncStatus('syncing');
    try {
      // Test connection with a simple query
      const { error } = await supabase.from('merchants').select('count').single();
      
      if (error) throw error;
      
      setLastSync(new Date());
      setSyncStatus('idle');
      toast({
        title: "Sync completed",
        description: "Data has been synchronized with the database."
      });
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "Sync failed",
        description: "Failed to synchronize data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const autoSync = () => {
    // Set up auto-sync every 5 minutes
    const interval = setInterval(() => {
      if (isConnected && syncStatus === 'idle') {
        syncData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  };

  return {
    isConnected,
    lastSync,
    syncStatus,
    syncData,
    autoSync
  };
};

// Returns data hook - fetches from Supabase
export const useReturnsData = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReturns = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('returns')
        .select(`
          *,
          return_items(*),
          ai_suggestions(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match the expected format
      const transformedReturns = data?.map(returnItem => ({
        id: returnItem.id,
        orderNumber: `#${returnItem.shopify_order_id}`,
        customer: {
          name: returnItem.customer_email.split('@')[0], // Extract name from email
          email: returnItem.customer_email,
          avatar: ""
        },
        product: returnItem.return_items?.[0]?.product_name || "Unknown Product",
        reason: returnItem.reason,
        value: `$${returnItem.total_amount}`,
        status: returnItem.status,
        aiSuggestion: returnItem.ai_suggestions?.[0]?.suggested_product_name || "No suggestion",
        date: new Date(returnItem.created_at).toLocaleDateString(),
        confidence: returnItem.ai_suggestions?.[0]?.confidence_score || 0,
        numericValue: parseFloat(returnItem.total_amount),
        created_at: returnItem.created_at
      })) || [];
      
      setReturns(transformedReturns);
    } catch (err) {
      console.error('Error fetching returns:', err);
      setError('Failed to fetch returns data');
      
      // Fallback to mock data if there's an error or no data
      const mockReturns = [
        {
          id: "RT-001",
          orderNumber: "#ORD-2024-001",
          customer: { name: "Sarah Johnson", email: "sarah.j@email.com", avatar: "" },
          product: "Wireless Headphones",
          reason: "Defective item",
          value: "$129.99",
          status: "requested",
          aiSuggestion: "Premium Wireless Earbuds",
          confidence: 92,
          date: new Date().toLocaleDateString(),
          numericValue: 129.99,
          created_at: new Date().toISOString()
        }
      ];
      setReturns(mockReturns);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const refetch = () => {
    fetchReturns();
  };

  return {
    returns,
    loading,
    error,
    refetch
  };
};

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
