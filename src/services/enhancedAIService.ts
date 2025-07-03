
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
        console.warn('⚠️ Edge function error, using enhanced fallback:', error.message);
        return this.getEnhancedFallbackRecommendation(context);
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
      console.error('💥 Enhanced AI Service Error:', error);
      return this.getEnhancedFallbackRecommendation(context);
    }
  }

  async analyzeReturnRisk(context: ReturnContext): Promise<ReturnAnalysis> {
    try {
      console.log('🔍 Analyzing return risk for:', context.returnId);

      const { data, error } = await supabase.functions.invoke('analyze-return-risk', {
        body: context
      });

      if (error) {
        console.warn('⚠️ Risk analysis error, using fallback:', error.message);
        return this.getFallbackRiskAnalysis(context);
      }

      return {
        riskLevel: data.riskLevel || 'low',
        fraudProbability: data.fraudProbability || 0.1,
        customerSatisfactionScore: data.customerSatisfactionScore || 80,
        recommendedAction: data.recommendedAction || 'approve',
        reasoning: data.reasoning || 'Low risk return from established customer'
      };
    } catch (error) {
      console.error('💥 Risk Analysis Error:', error);
      return this.getFallbackRiskAnalysis(context);
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
        return this.getFallbackCustomerMessage(context, recommendation);
      }

      return data.message || this.getFallbackCustomerMessage(context, recommendation);
    } catch (error) {
      console.error('💥 Customer Message Generation Error:', error);
      return this.getFallbackCustomerMessage(context, recommendation);
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

      return predictions || this.getFallbackTrendPrediction();
    } catch (error) {
      console.error('💥 Trend Prediction Error:', error);
      return this.getFallbackTrendPrediction();
    }
  }

  private getEnhancedFallbackRecommendation(context: ReturnContext): AIRecommendation {
    console.log('🔄 Using enhanced fallback AI recommendation logic');
    
    const reasonAnalysis = this.analyzeReturnReasonAdvanced(context.returnReason, context.orderValue);
    const customerScore = this.calculateCustomerRetentionScore(context);
    
    return {
      type: reasonAnalysis.recommendedType,
      suggestedProduct: `${reasonAnalysis.suggestedType} ${context.productName}`,
      confidence: reasonAnalysis.confidence,
      reasoning: reasonAnalysis.reasoning,
      expectedOutcome: reasonAnalysis.expectedOutcome,
      alternativeOptions: reasonAnalysis.alternatives,
      customerRetentionScore: customerScore
    };
  }

  private analyzeReturnReasonAdvanced(reason: string, orderValue: number) {
    const reasonLower = reason.toLowerCase();
    
    if (reasonLower.includes('too small') || reasonLower.includes('size')) {
      return {
        recommendedType: 'exchange' as const,
        suggestedType: 'Larger Size',
        confidence: 88,
        reasoning: 'Size issues indicate high exchange success probability. Offering a larger size maintains customer satisfaction.',
        expectedOutcome: 'High probability of successful exchange with improved fit',
        alternatives: ['Store credit with sizing guide', 'Free return with size consultation']
      };
    }
    
    if (reasonLower.includes('quality') || reasonLower.includes('defective')) {
      return {
        recommendedType: orderValue > 100 ? 'exchange' as const : 'refund' as const,
        suggestedType: 'Premium Quality Alternative',
        confidence: 92,
        reasoning: 'Quality issues suggest product improvement opportunity. Higher-value orders warrant premium replacement.',
        expectedOutcome: 'Restored customer confidence through quality upgrade',
        alternatives: ['Full refund with apology', 'Store credit with quality guarantee']
      };
    }
    
    if (reasonLower.includes('color') || reasonLower.includes('style')) {
      return {
        recommendedType: 'exchange' as const,
        suggestedType: 'Alternative Style',
        confidence: 82,
        reasoning: 'Aesthetic preferences indicate personal taste mismatch. Style alternatives maintain engagement.',
        expectedOutcome: 'Improved satisfaction through better style match',
        alternatives: ['Store credit for future purchase', 'Curated style recommendations']
      };
    }

    if (reasonLower.includes('price') || reasonLower.includes('expensive')) {
      return {
        recommendedType: 'store_credit' as const,
        suggestedType: 'Budget-Friendly Alternative',
        confidence: 78,
        reasoning: 'Price sensitivity suggests budget constraints. Store credit with discount maintains value.',
        expectedOutcome: 'Customer retention through value optimization',
        alternatives: ['Partial refund with discount', 'Payment plan for future purchases']
      };
    }
    
    return {
      recommendedType: 'exchange' as const,
      suggestedType: 'Enhanced Alternative',
      confidence: 75,
      reasoning: 'Standard return analysis suggests exchange opportunity with improved product selection.',
      expectedOutcome: 'Maintained customer relationship through proactive service',
      alternatives: ['Full refund option', 'Store credit with bonus']
    };
  }

  private calculateCustomerRetentionScore(context: ReturnContext): number {
    let score = 70; // Base score
    
    // Adjust based on order value
    if (context.orderValue > 200) score += 10;
    else if (context.orderValue < 50) score -= 5;
    
    // Adjust based on customer history if available
    if (context.customerHistory) {
      const returnRate = context.customerHistory.totalReturns / context.customerHistory.totalOrders;
      if (returnRate < 0.2) score += 15;
      else if (returnRate > 0.5) score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  private getFallbackRiskAnalysis(context: ReturnContext): ReturnAnalysis {
    const riskScore = context.orderValue > 500 ? 'medium' : 'low';
    
    return {
      riskLevel: riskScore,
      fraudProbability: context.orderValue > 1000 ? 0.2 : 0.05,
      customerSatisfactionScore: 75,
      recommendedAction: 'approve',
      reasoning: 'Standard risk assessment based on order value and return pattern'
    };
  }

  private getFallbackCustomerMessage(context: ReturnContext, recommendation: AIRecommendation): string {
    return `Hi there! We've received your return request for ${context.productName}. Based on your feedback about "${context.returnReason}", we'd love to help you find a better alternative. Our team has reviewed your request and we're happy to assist with ${recommendation.type === 'exchange' ? 'an exchange' : 'processing your return'}. We'll be in touch shortly with next steps!`;
  }

  private getFallbackTrendPrediction() {
    return {
      trends: [
        { category: 'Size Issues', percentage: 35, trend: 'stable' },
        { category: 'Quality Concerns', percentage: 25, trend: 'decreasing' },
        { category: 'Style Preferences', percentage: 20, trend: 'increasing' },
        { category: 'Other', percentage: 20, trend: 'stable' }
      ],
      recommendations: [
        'Improve product sizing guides',
        'Enhanced quality control processes',
        'Style preference surveys'
      ]
    };
  }
}

export const enhancedAIService = new EnhancedAIService();
