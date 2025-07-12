
import { supabase } from '@/integrations/supabase/client';

export interface RealAIInsight {
  id: string;
  returnId: string;
  customer_email: string;
  suggestion: string;
  reasoning: string;
  confidence: number;
  accepted: boolean | null;
  suggestion_type: string;
  created_at: string;
}

export class RealAIInsightsService {
  static async getInsights(merchantId: string): Promise<RealAIInsight[]> {
    console.log('🤖 Fetching real AI insights for merchant:', merchantId);

    try {
      const { data, error } = await supabase
        .from('ai_suggestions')
        .select(`
          *,
          returns!inner (
            id,
            customer_email,
            merchant_id,
            created_at
          )
        `)
        .eq('returns.merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const insights: RealAIInsight[] = (data || []).map(item => ({
        id: item.id,
        returnId: item.return_id || '',
        customer_email: item.returns?.customer_email || '',
        suggestion: item.suggested_product_name || item.suggestion_type,
        reasoning: item.reasoning,
        confidence: Math.round(item.confidence_score * 100),
        accepted: item.accepted,
        suggestion_type: item.suggestion_type,
        created_at: item.created_at
      }));

      console.log('✅ Real AI insights loaded:', insights.length);
      return insights;

    } catch (error) {
      console.error('💥 Error fetching AI insights:', error);
      throw error;
    }
  }

  static async updateInsightFeedback(suggestionId: string, isPositive: boolean): Promise<void> {
    console.log('🔄 Updating AI insight feedback:', suggestionId, isPositive);

    try {
      const { error } = await supabase
        .from('ai_suggestions')
        .update({ accepted: isPositive })
        .eq('id', suggestionId);

      if (error) throw error;

      console.log('✅ AI insight feedback updated');
    } catch (error) {
      console.error('💥 Error updating AI insight feedback:', error);
      throw error;
    }
  }

  static async subscribeToInsights(merchantId: string, callback: (insights: RealAIInsight[]) => void) {
    const channel = supabase
      .channel(`ai-insights-${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions',
        },
        async () => {
          try {
            const insights = await this.getInsights(merchantId);
            callback(insights);
          } catch (error) {
            console.error('Error updating AI insights:', error);
          }
        }
      )
      .subscribe();

    return channel;
  }
}
