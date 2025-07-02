
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
  return_status?: string;
}

export const useAIInsights = () => {
  const { profile } = useProfile();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    if (!profile?.merchant_id) {
      console.log('❌ No merchant_id available for AI insights');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching AI insights for merchant:', profile.merchant_id);

      // Fetch AI suggestions with complete return data - no artificial limits
      const { data: suggestions, error: fetchError } = await supabase
        .from('ai_suggestions')
        .select(`
          *,
          returns!inner (
            id,
            customer_email,
            merchant_id,
            status,
            created_at,
            reason
          )
        `)
        .eq('returns.merchant_id', profile.merchant_id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error fetching AI suggestions:', fetchError);
        throw fetchError;
      }

      console.log('📊 Raw AI suggestions data:', suggestions?.length || 0, 'records');

      // Transform and validate the data
      const transformedInsights: AIInsight[] = (suggestions || [])
        .filter(suggestion => suggestion.returns) // Ensure we have return data
        .map(suggestion => {
          const returnData = Array.isArray(suggestion.returns) 
            ? suggestion.returns[0] 
            : suggestion.returns;
          
          return {
            id: suggestion.id,
            returnId: suggestion.return_id,
            suggestion: suggestion.suggested_product_name || 'AI Recommendation',
            confidence: Math.round((suggestion.confidence_score || 0) * 100),
            reasoning: suggestion.reasoning || 'AI-generated recommendation',
            accepted: suggestion.accepted,
            suggestion_type: suggestion.suggestion_type || 'product_exchange',
            created_at: suggestion.created_at,
            customer_email: returnData?.customer_email,
            return_status: returnData?.status
          };
        });

      console.log('✅ Transformed AI insights:', transformedInsights.length, 'insights');
      setInsights(transformedInsights);

    } catch (err) {
      console.error('💥 Error in fetchInsights:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AI insights');
      setInsights([]);
    } finally {
      setLoading(false);
    }
  };

  const generateInsightForReturn = async (returnData: any) => {
    if (!returnData.return_items || returnData.return_items.length === 0) {
      console.log('❌ No return items found for insight generation');
      return null;
    }

    try {
      console.log('🤖 Generating AI insight for return:', returnData.id);
      
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
          confidence_score: recommendation.confidence / 100,
          reasoning: recommendation.reasoning,
          accepted: null
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving AI suggestion:', error);
        throw error;
      }

      console.log('✅ AI insight generated and saved:', data.id);
      
      // Refresh insights
      await fetchInsights();
      
      return data;
    } catch (err) {
      console.error('💥 Error generating AI insight:', err);
      throw err;
    }
  };

  const updateInsightFeedback = async (insightId: string, accepted: boolean) => {
    try {
      console.log('📝 Updating insight feedback:', insightId, accepted);
      
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ accepted })
        .eq('id', insightId);

      if (error) {
        console.error('❌ Error updating feedback:', error);
        throw error;
      }

      // Update local state immediately
      setInsights(prev => 
        prev.map(insight => 
          insight.id === insightId 
            ? { ...insight, accepted }
            : insight
        )
      );

      console.log('✅ Feedback updated successfully');
    } catch (err) {
      console.error('💥 Error updating insight feedback:', err);
      throw err;
    }
  };

  // Set up real-time subscription for AI suggestions
  useEffect(() => {
    if (!profile?.merchant_id) return;

    console.log('🔄 Setting up AI insights real-time subscription');

    const channel = supabase
      .channel('ai-insights-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions'
        },
        (payload) => {
          console.log('📡 Real-time AI suggestion change:', payload.eventType);
          // Refresh insights when AI suggestions change
          fetchInsights();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns'
        },
        (payload) => {
          console.log('📡 Real-time returns change:', payload.eventType);
          // Refresh insights when returns change (affects related data)
          fetchInsights();
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 Cleaning up AI insights subscription');
      supabase.removeChannel(channel);
    };
  }, [profile?.merchant_id]);

  // Initial fetch
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
