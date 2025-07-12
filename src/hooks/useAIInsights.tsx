
import { useState, useEffect } from 'react';
import { useProfile } from './useProfile';
import { RealAIInsightsService, type RealAIInsight } from '@/services/realAIInsightsService';

export const useAIInsights = () => {
  const { profile } = useProfile();
  const [insights, setInsights] = useState<RealAIInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.merchant_id) {
      setInsights([]);
      setLoading(false);
      return;
    }

    let channel: any;

    const loadInsights = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await RealAIInsightsService.getInsights(profile.merchant_id);
        setInsights(data);
        
        // Set up real-time subscription
        channel = await RealAIInsightsService.subscribeToInsights(
          profile.merchant_id,
          (updatedInsights) => {
            console.log('🤖 AI insights updated via subscription');
            setInsights(updatedInsights);
          }
        );
        
      } catch (err) {
        console.error('Failed to load AI insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to load AI insights');
      } finally {
        setLoading(false);
      }
    };

    loadInsights();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [profile?.merchant_id]);

  const updateInsightFeedback = async (suggestionId: string, isPositive: boolean) => {
    try {
      await RealAIInsightsService.updateInsightFeedback(suggestionId, isPositive);
      
      // Update local state optimistically
      setInsights(prev => 
        prev.map(insight => 
          insight.id === suggestionId 
            ? { ...insight, accepted: isPositive }
            : insight
        )
      );
    } catch (error) {
      console.error('Error updating insight feedback:', error);
      throw error;
    }
  };

  return {
    insights,
    loading,
    error,
    updateInsightFeedback
  };
};
