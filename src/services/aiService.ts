
import { invokeEdgeFunction } from '@/utils/edgeFunctionHelper';

interface AIRecommendationRequest {
  returnReason: string;
  productName: string;
  customerEmail: string;
  orderValue: number;
  merchantSettings?: any;
}

interface AIRecommendationResponse {
  suggestedProduct: string;
  confidence: number;
  reasoning: string;
  alternativeProducts?: string[];
}

interface AdvancedRecommendationResponse {
  type: string;
  suggestedProduct: string;
  confidence: number;
  reasoning: string;
  expectedOutcome: string;
  alternativeOptions: string[];
  customerRetentionScore: number;
}

interface RiskAnalysisResponse {
  riskLevel: 'low' | 'medium' | 'high';
  fraudProbability: number;
  customerSatisfactionScore: number;
  recommendedAction: 'approve' | 'investigate' | 'reject';
  reasoning: string;
}

export class AIService {
  /**
   * Generate basic exchange recommendation
   */
  async generateExchangeRecommendation(request: AIRecommendationRequest): Promise<AIRecommendationResponse> {
    console.log('🤖 Generating AI recommendation for:', request.productName);
    
    const response = await invokeEdgeFunction<AIRecommendationResponse>('generate-exchange-recommendation', {
      returnReason: request.returnReason,
      productName: request.productName,
      customerEmail: request.customerEmail,
      orderValue: request.orderValue,
      merchantSettings: request.merchantSettings
    });

    if (!response.success) {
      console.warn('⚠️ Edge function error, using fallback:', response.error);
      return this.getFallbackRecommendation(request);
    }

    return {
      suggestedProduct: response.data?.suggestedProduct || response.data?.suggestion,
      confidence: Math.max(70, Math.min(99, response.data?.confidence || 85)),
      reasoning: response.data?.reasoning || 'AI-generated recommendation based on return analysis',
      alternativeProducts: response.data?.alternativeProducts
    };
  }

  /**
   * Generate advanced AI recommendation with business insights
   */
  async generateAdvancedRecommendation(params: {
    returnId: string;
    productName: string;
    returnReason: string;
    customerEmail: string;
    orderValue: number;
    customerHistory?: any;
    merchantSettings?: any;
  }): Promise<AdvancedRecommendationResponse> {
    const response = await invokeEdgeFunction<AdvancedRecommendationResponse>('generate-advanced-recommendation', params);

    if (!response.success) {
      // Fallback response
      return {
        type: 'exchange',
        suggestedProduct: `Enhanced ${params.productName}`,
        confidence: 75,
        reasoning: 'Fallback recommendation due to processing error',
        expectedOutcome: 'Standard processing',
        alternativeOptions: ['Refund', 'Store credit'],
        customerRetentionScore: 70
      };
    }

    return response.data!;
  }

  /**
   * Analyze return risk for fraud detection
   */
  async analyzeReturnRisk(params: {
    returnId: string;
    productName: string;
    returnReason: string;
    customerEmail: string;
    orderValue: number;
    customerHistory?: any;
  }): Promise<RiskAnalysisResponse> {
    const response = await invokeEdgeFunction<RiskAnalysisResponse>('analyze-return-risk', params);

    if (!response.success) {
      // Fallback low-risk response
      return {
        riskLevel: 'low',
        fraudProbability: 0.05,
        customerSatisfactionScore: 70,
        recommendedAction: 'approve',
        reasoning: 'Fallback risk analysis due to processing error'
      };
    }

    return response.data!;
  }

  /**
   * Generate customer-facing messages
   */
  async generateCustomerMessage(params: {
    returnId: string;
    customerEmail: string;
    returnReason: string;
    returnStatus: string;
    messageType?: 'update' | 'followup' | 'apology' | 'custom';
    customPrompt?: string;
    productName?: string;
  }) {
    const response = await invokeEdgeFunction('generate-customer-message', params);

    if (!response.success) {
      return {
        message: 'Thank you for your return request. We are processing it and will update you soon.',
        messageType: params.messageType || 'update'
      };
    }

    return response.data;
  }

  /**
   * Fallback recommendation logic (private method)
   */
  private getFallbackRecommendation(request: AIRecommendationRequest): AIRecommendationResponse {
    console.log('🔄 Using fallback AI recommendation logic');
    
    const reasonAnalysis = this.analyzeReturnReason(request.returnReason);
    
    return {
      suggestedProduct: `${reasonAnalysis.suggestedType} ${request.productName}`,
      confidence: reasonAnalysis.confidence,
      reasoning: reasonAnalysis.reasoning
    };
  }

  private analyzeReturnReason(reason: string): { suggestedType: string; confidence: number; reasoning: string } {
    const reasonLower = reason.toLowerCase();
    
    if (reasonLower.includes('too small') || reasonLower.includes('size')) {
      return {
        suggestedType: 'Larger Size',
        confidence: 88,
        reasoning: 'Size-related return suggests customer needs a different size option.'
      };
    }
    
    if (reasonLower.includes('quality') || reasonLower.includes('defective') || reasonLower.includes('broken')) {
      return {
        suggestedType: 'Premium Quality',
        confidence: 92,
        reasoning: 'Quality concerns indicate customer would benefit from a higher-grade product.'
      };
    }
    
    if (reasonLower.includes('color') || reasonLower.includes('style') || reasonLower.includes('design')) {
      return {
        suggestedType: 'Alternative Style',
        confidence: 82,
        reasoning: 'Aesthetic preferences suggest offering a different style or color variant.'
      };
    }
    
    if (reasonLower.includes('too expensive') || reasonLower.includes('price') || reasonLower.includes('cost')) {
      return {
        suggestedType: 'Budget-Friendly',
        confidence: 78,
        reasoning: 'Price sensitivity indicates customer would prefer a more affordable alternative.'
      };
    }

    if (reasonLower.includes('too big') || reasonLower.includes('large')) {
      return {
        suggestedType: 'Smaller Size',
        confidence: 86,
        reasoning: 'Size issue suggests customer needs a smaller size option.'
      };
    }
    
    return {
      suggestedType: 'Enhanced Version',
      confidence: 75,
      reasoning: 'Based on common exchange patterns, this alternative should better meet customer needs.'
    };
  }
}

export const aiService = new AIService();
