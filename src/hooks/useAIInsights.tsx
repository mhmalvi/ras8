
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';
import { aiService } from '@/services/aiService';

interface AIInsight {
  id: string;
  returnId: string;
  suggestion: string;
  confidence: number;
  reasoning: string;
  accepted: boolean | null;
  suggestion_type: string;
  created_at: string;
  customer_email?: string;
}

export const useAIInsights = () => {
  const { profile } = useProfile();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!profile?.merchant_id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch AI suggestions with related return data
      const { data: suggestions, error: fetchError } = await supabase
        .from('ai_suggestions')
        .select(`
          *,
          returns!inner (
            id,
            customer_email,
            merchant_id
          )
        `)
        .eq('returns.merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Transform the data to match our interface
      const transformedInsights: AIInsight[] = (suggestions || []).map(suggestion => ({
        id: suggestion.id,
        returnId: suggestion.return_id,
        suggestion: suggestion.suggested_product_name || 'Unknown Product',
        confidence: Math.round(suggestion.confidence_score * 100),
        reasoning: suggestion.reasoning,
        accepted: suggestion.accepted,
        suggestion_type: suggestion.suggestion_type,
        created_at: suggestion.created_at,
        customer_email: (suggestion.returns as any)?.customer_email
      }));

      setInsights(transformedInsights);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setLoading(false);
    }
  };

  const generateInsightForReturn = async (returnData: any) => {
    if (!returnData.return_items || returnData.return_items.length === 0) {
      return null;
    }

    try {
      const primaryItem = returnData.return_items[0];
      const recommendation = await aiService.generateExchangeRecommendation({
        returnReason: returnData.reason,
        productName: primaryItem.product_name,
        customerEmail: returnData.customer_email,
        orderValue: returnData.total_amount
      });

      // Save to database
      const { data, error } = await supabase
        .from('ai_suggestions')
        .insert({
          return_id: returnData.id,
          suggestion_type: 'product_exchange',
          suggested_product_name: recommendation.suggestedProduct,
          confidence_score: recommendation.confidence / 100, // Convert to decimal
          reasoning: recommendation.reasoning,
          accepted: null
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh insights after creating new one
      await fetchInsights();
      
      return data;
    } catch (err) {
      console.error('Error generating AI insight:', err);
      throw err;
    }
  };

  const updateInsightFeedback = async (insightId: string, accepted: boolean) => {
    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ accepted })
        .eq('id', insightId);

      if (error) throw error;

      // Update local state
      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, accepted }
            : insight
        )
      );
    } catch (err) {
      console.error('Error updating insight feedback:', err);
      throw err;
    }
  };

  // Set up real-time subscription for AI suggestions
  useEffect(() => {
    if (!profile?.merchant_id) return;

    const channel = supabase
      .channel('ai-suggestions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions'
        },
        () => {
          // Refresh insights when AI suggestions change
          fetchInsights();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.merchant_id]);

  useEffect(() => {
    fetchInsights();
  }, [profile?.merchant_id]);

  return {
    insights,
    loading,
    error,
    generateInsightForReturn,
    updateInsightFeedback,
    refetch: fetchInsights
  };
};
