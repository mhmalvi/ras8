
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
  created_at: string;
}

export const useAIInsights = () => {
  const { profile } = useProfile();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          confidence_score: recommendation.confidence,
          reasoning: recommendation.reasoning,
          accepted: null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error generating AI insight:', err);
      throw err;
    }
  };

  const fetchInsights = async () => {
    if (!profile?.merchant_id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select(`
          *,
          returns!inner(merchant_id)
        `)
        .eq('returns.merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedInsights = data.map(item => ({
        id: item.id,
        returnId: item.return_id,
        suggestion: item.suggested_product_name,
        confidence: item.confidence_score,
        reasoning: item.reasoning,
        accepted: item.accepted,
        created_at: item.created_at
      }));

      setInsights(formattedInsights);
      setError(null);
    } catch (err) {
      console.error('Error fetching AI insights:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
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
