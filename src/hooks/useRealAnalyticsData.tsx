
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface AnalyticsData {
  totalReturns: number;
  totalRefunds: number;
  totalExchanges: number;
  aiAcceptanceRate: number;
  revenueImpact: number;
  returnsByStatus: {
    requested: number;
    approved: number;
    in_transit: number;
    completed: number;
  };
  monthlyTrends: Array<{
    month: string;
    returns: number;
    exchanges: number;
    refunds: number;
  }>;
}

export const useRealAnalyticsData = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calculateAnalytics = async (merchantId: string) => {
    try {
      console.log('🔄 Calculating analytics for merchant:', merchantId);
      
      // Fetch returns data with related items and AI suggestions
      const { data: returns, error: returnsError } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (*),
          ai_suggestions (*)
        `)
        .eq('merchant_id', merchantId);

      if (returnsError) {
        console.error('❌ Error fetching returns:', returnsError);
        throw returnsError;
      }

      console.log('📊 Returns data fetched:', returns?.length || 0, 'returns');

      // Calculate analytics from returns data
      const totalReturns = returns?.length || 0;
      let totalRefunds = 0;
      let totalExchanges = 0;
      let aiSuggestionsAccepted = 0;
      let totalAISuggestions = 0;
      let revenueImpact = 0;

      const returnsByStatus = {
        requested: 0,
        approved: 0,
        in_transit: 0,
        completed: 0
      };

      returns?.forEach(returnItem => {
        // Count by status
        const status = returnItem.status as keyof typeof returnsByStatus;
        if (returnsByStatus.hasOwnProperty(status)) {
          returnsByStatus[status]++;
        }
        
        // Count refunds vs exchanges and calculate revenue impact
        returnItem.return_items?.forEach((item: any) => {
          if (item.action === 'refund') {
            totalRefunds++;
          } else if (item.action === 'exchange') {
            totalExchanges++;
            revenueImpact += Number(item.price) || 0;
          }
        });

        // Calculate AI acceptance rate
        returnItem.ai_suggestions?.forEach((suggestion: any) => {
          totalAISuggestions++;
          if (suggestion.accepted === true) {
            aiSuggestionsAccepted++;
          }
        });
      });

      const aiAcceptanceRate = totalAISuggestions > 0 
        ? Math.round((aiSuggestionsAccepted / totalAISuggestions) * 100)
        : 0;

      // Generate monthly trends based on actual data
      const now = new Date();
      const monthlyTrends = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'short' });
        
        // Filter returns for this month
        const monthReturns = returns?.filter(r => {
          const returnDate = new Date(r.created_at);
          return returnDate.getMonth() === date.getMonth() && 
                 returnDate.getFullYear() === date.getFullYear();
        }) || [];

        const monthlyReturnsCount = monthReturns.length;
        let monthlyExchanges = 0;
        let monthlyRefunds = 0;

        monthReturns.forEach(returnItem => {
          returnItem.return_items?.forEach((item: any) => {
            if (item.action === 'exchange') {
              monthlyExchanges++;
            } else if (item.action === 'refund') {
              monthlyRefunds++;
            }
          });
        });
        
        return {
          month: monthName,
          returns: monthlyReturnsCount,
          exchanges: monthlyExchanges,
          refunds: monthlyRefunds
        };
      });

      const analyticsData = {
        totalReturns,
        totalRefunds,
        totalExchanges,
        aiAcceptanceRate,
        revenueImpact,
        returnsByStatus,
        monthlyTrends
      };

      console.log('📈 Analytics calculated:', {
        totalReturns,
        aiAcceptanceRate,
        revenueImpact,
        monthlyTrends: monthlyTrends.length
      });

      return analyticsData;

    } catch (error) {
      console.error('💥 Error calculating analytics:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Don't proceed if profile is still loading
    if (profileLoading) {
      console.log('⏳ Profile still loading, waiting...');
      return;
    }

    // Don't proceed if no merchant_id
    if (!profile?.merchant_id) {
      console.log('❌ No merchant_id in profile');
      setAnalytics(null);
      setLoading(false);
      setError('No merchant profile found');
      return;
    }

    console.log('🔍 useRealAnalyticsData: Profile loaded with merchant_id:', profile.merchant_id);

    let channel: any;

    const fetchAndSubscribe = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Calculate initial analytics
        const analyticsData = await calculateAnalytics(profile.merchant_id);
        setAnalytics(analyticsData);

        // Set up real-time subscription for returns changes
        channel = supabase
          .channel(`analytics-${profile.merchant_id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'returns',
              filter: `merchant_id=eq.${profile.merchant_id}`
            },
            async (payload) => {
              console.log('📊 Analytics real-time update - returns:', payload.eventType);
              
              try {
                const updatedAnalytics = await calculateAnalytics(profile.merchant_id);
                setAnalytics(updatedAnalytics);
              } catch (error) {
                console.error('❌ Error updating analytics from returns:', error);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'return_items',
            },
            async (payload) => {
              console.log('📊 Analytics real-time update - return_items:', payload.eventType);
              
              try {
                const updatedAnalytics = await calculateAnalytics(profile.merchant_id);
                setAnalytics(updatedAnalytics);
              } catch (error) {
                console.error('❌ Error updating analytics from return_items:', error);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'ai_suggestions',
            },
            async (payload) => {
              console.log('🤖 Analytics real-time update - ai_suggestions:', payload.eventType);
              
              try {
                const updatedAnalytics = await calculateAnalytics(profile.merchant_id);
                setAnalytics(updatedAnalytics);
              } catch (error) {
                console.error('❌ Error updating analytics from ai_suggestions:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log('📊 Analytics subscription status:', status);
          });

      } catch (err) {
        console.error('💥 Error in analytics setup:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSubscribe();
    
    // Listen for manual data sync events
    const handleDataSync = () => {
      console.log('📢 Data sync event received in useRealAnalyticsData');
      if (profile?.merchant_id) {
        fetchAndSubscribe();
      }
    };
    
    window.addEventListener('dataSync', handleDataSync);
    window.addEventListener('profileUpdated', handleDataSync);
    
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('dataSync', handleDataSync);
      window.removeEventListener('profileUpdated', handleDataSync);
    };
  }, [profile?.merchant_id, profileLoading]); // Added profileLoading to dependencies

  return {
    analytics,
    loading,
    error
  };
};
