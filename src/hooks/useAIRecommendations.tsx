
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AIRecommendation {
  suggestedProduct: string;
  reasoning: string;
  confidence: number;
}

export const useAIRecommendations = () => {
  const [loading, setLoading] = useState(false);
  const [aiRecommendations, setAIRecommendations] = useState<AIRecommendation[]>([]);

  const generateAIRecommendations = async (
    returnReason: string,
    productName: string,
    customerEmail: string,
    orderValue: number
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-exchange-recommendation', {
        body: {
          returnReason,
          productName,
          customerEmail,
          orderValue
        }
      });

      if (error) {
        console.warn('AI recommendations failed:', error);
        setAIRecommendations([]);
        return;
      }

      if (data?.recommendations) {
        setAIRecommendations(data.recommendations);
      }
    } catch (err) {
      console.warn('AI recommendations failed:', err);
      setAIRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const storeAISuggestions = async (returnId: string, recommendations: AIRecommendation[]) => {
    if (recommendations.length === 0) return;

    const suggestions = recommendations.map(rec => ({
      return_id: returnId,
      suggestion_type: 'exchange',
      suggested_product_name: rec.suggestedProduct,
      reasoning: rec.reasoning,
      confidence_score: rec.confidence / 100
    }));

    const { error } = await supabase
      .from('ai_suggestions')
      .insert(suggestions);

    if (error) {
      console.warn('Failed to store AI suggestions:', error);
    }
  };

  return {
    loading,
    aiRecommendations,
    generateAIRecommendations,
    storeAISuggestions
  };
};
