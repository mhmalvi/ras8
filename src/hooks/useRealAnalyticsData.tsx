
import { useState, useEffect } from 'react';
import { useProfile } from './useProfile';
import { RealTimeAnalyticsService, type RealTimeAnalytics } from '@/services/realTimeAnalyticsService';

export const useRealAnalyticsData = () => {
  const { profile, loading: profileLoading } = useProfile();
  const [analytics, setAnalytics] = useState<RealTimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profileLoading) {
      console.log('⏳ Profile still loading, waiting...');
      return;
    }

    if (!profile?.merchant_id) {
      console.log('❌ No merchant_id in profile');
      setAnalytics(null);
      setLoading(false);
      setError('No merchant profile found');
      return;
    }

    console.log('🔍 Loading analytics for merchant:', profile.merchant_id);

    let channel: any;

    const fetchAndSubscribe = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const analyticsData = await RealTimeAnalyticsService.getAnalytics(profile.merchant_id);
        setAnalytics(analyticsData);

        // Set up real-time subscription
        channel = await RealTimeAnalyticsService.subscribeToUpdates(
          profile.merchant_id,
          (updatedAnalytics) => {
            console.log('📊 Analytics updated via subscription');
            setAnalytics(updatedAnalytics);
          }
        );

      } catch (err) {
        console.error('💥 Error loading analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSubscribe();
    
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [profile?.merchant_id, profileLoading]);

  return {
    analytics,
    loading,
    error
  };
};
