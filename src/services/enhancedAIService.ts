
import { supabase } from '@/integrations/supabase/client';

interface ReturnContext {
  returnId: string;
  productName: string;
  returnReason: string;
  customerEmail: string;
  orderValue: number;
  customerHistory?: CustomerHistory;
  merchantSettings?: MerchantSettings;
}

interface CustomerHistory {
  totalOrders: number;
  totalReturns: number;
  averageOrderValue: number;
  preferredCategories: string[];
  lastOrderDate: string;
}

interface MerchantSettings {
  exchangeIncentives: boolean;
  autoApprovalThreshold: number;
  preferredExchangeProducts: string[];
  businessModel: 'fashion' | 'electronics' | 'home' | 'general';
}

interface AIRecommendation {
  type: 'exchange' | 'refund' | 'store_credit' | 'partial_exchange';
  suggestedProduct?: string;
  confidence: number;
  reasoning: string;
  expectedOutcome: string;
  alternativeOptions: string[];
  customerRetentionScore: number;
}

interface ReturnAnalysis {
  riskLevel: 'low' | 'medium' | 'high';
  fraudProbability: number;
  customerSatisfactionScore: number;
  recommendedAction: 'approve' | 'investigate' | 'reject';
  reasoning: string;
}

export class EnhancedAIService {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async generateAdvancedRecommendation(context: ReturnContext): Promise<AIRecommendation> {
    try {
      console.log('🤖 Generating advanced AI recommendation for:', context.productName);
      
      // Try Supabase edge function first
      const { data, error } = await supabase.functions.invoke('generate-advanced-recommendation', {
        body: {
          ...context,
          includeAnalysis: true,
          includeAlternatives: true
        }
      });

      if (error) {
        console.error('Advanced AI recommendation failed:', error.message);
        throw new Error(`Advanced AI recommendation unavailable: ${error.message || 'Service temporarily unavailable'}`);
      }

      return {
        type: data.type || 'exchange',
        suggestedProduct: data.suggestedProduct,
        confidence: Math.max(70, Math.min(99, data.confidence || 85)),
        reasoning: data.reasoning || 'AI-generated recommendation based on return analysis',
        expectedOutcome: data.expectedOutcome || 'Improved customer satisfaction',
        alternativeOptions: data.alternativeOptions || [],
        customerRetentionScore: data.customerRetentionScore || 75
      };
    } catch (error) {
      console.error('Advanced AI recommendation failed:', error);
      throw new Error(`Advanced AI recommendation unavailable: ${error instanceof Error ? error.message : 'Service temporarily unavailable'}`);
    }
  }

  async analyzeReturnRisk(context: ReturnContext): Promise<ReturnAnalysis> {
    try {
      console.log('🔍 Analyzing return risk for:', context.returnId);

      const { data, error } = await supabase.functions.invoke('analyze-return-risk', {
        body: context
      });

      if (error) {
        console.error('AI risk analysis failed:', error.message);
        throw new Error(`AI risk analysis unavailable: ${error.message || 'Service temporarily unavailable'}`);
      }

      return {
        riskLevel: data.riskLevel || 'low',
        fraudProbability: data.fraudProbability || 0.1,
        customerSatisfactionScore: data.customerSatisfactionScore || 80,
        recommendedAction: data.recommendedAction || 'approve',
        reasoning: data.reasoning || 'Low risk return from established customer'
      };
    } catch (error) {
      console.error('AI risk analysis failed:', error);
      throw new Error(`AI risk analysis unavailable: ${error instanceof Error ? error.message : 'Service temporarily unavailable'}`);
    }
  }

  async generateCustomerMessage(
    context: ReturnContext, 
    recommendation: AIRecommendation
  ): Promise<string> {
    try {
      console.log('💬 Generating customer message for:', context.customerEmail);

      const { data, error } = await supabase.functions.invoke('generate-customer-message', {
        body: {
          context,
          recommendation,
          tone: 'friendly_professional'
        }
      });

      if (error) {
        console.error('AI customer message generation failed:', error.message);
        throw new Error(`AI customer message generation unavailable: ${error.message || 'Service temporarily unavailable'}`);
      }

      return data.message;
    } catch (error) {
      console.error('AI customer message generation failed:', error);
      throw new Error(`AI customer message generation unavailable: ${error instanceof Error ? error.message : 'Service temporarily unavailable'}`);
    }
  }

  async predictReturnTrends(merchantId: string): Promise<any> {
    try {
      console.log('📊 Predicting return trends for merchant:', merchantId);

      // Fetch historical return data
      const { data: returns, error } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (*)
        `)
        .eq('merchant_id', merchantId)
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Generate predictions using AI
      const { data: predictions } = await supabase.functions.invoke('predict-return-trends', {
        body: {
          merchantId,
          historicalData: returns,
          analysisType: 'comprehensive'
        }
      });

      return predictions;
    } catch (error) {
      console.error('AI trend prediction failed:', error);
      throw new Error(`AI trend prediction unavailable: ${error instanceof Error ? error.message : 'Service temporarily unavailable'}`);
    }
  }

}

export const enhancedAIService = new EnhancedAIService();
