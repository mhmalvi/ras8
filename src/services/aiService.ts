
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
      console.error('AI exchange recommendation failed:', response.error);
      throw new Error(`AI exchange recommendation unavailable: ${response.error || 'Service temporarily unavailable'}`);
    }

    return {
      suggestedProduct: response.data?.suggestedProduct || 'Enhanced Product',
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
      console.error('Advanced AI recommendation failed:', response.error);
      throw new Error(`Advanced AI recommendation unavailable: ${response.error || 'Service temporarily unavailable'}`);
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
      // Log the error for monitoring but throw it to ensure proper error handling
      console.error('AI risk analysis failed:', response.error);
      throw new Error(`AI risk analysis unavailable: ${response.error || 'Service temporarily unavailable'}`);
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
      console.error('AI customer message generation failed:', response.error);
      throw new Error(`AI customer message generation unavailable: ${response.error || 'Service temporarily unavailable'}`);
    }

    return response.data;
  }

}

export const aiService = new AIService();
