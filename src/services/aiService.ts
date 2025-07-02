
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

export class AIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  async generateExchangeRecommendation(
    request: AIRecommendationRequest
  ): Promise<AIRecommendationResponse> {
    try {
      console.log('🤖 Generating AI recommendation for:', request.productName);
      
      // Try Supabase edge function first
      const { supabase } = await import('@/integrations/supabase/client');
      
      const { data, error } = await supabase.functions.invoke('generate-exchange-recommendation', {
        body: {
          returnReason: request.returnReason,
          productName: request.productName,
          customerEmail: request.customerEmail,
          orderValue: request.orderValue
        }
      });

      if (error) {
        console.warn('⚠️ Edge function error, using fallback:', error.message);
        return this.getFallbackRecommendation(request);
      }

      console.log('✅ AI recommendation generated successfully');
      
      return {
        suggestedProduct: data.suggestedProduct || data.suggestion,
        confidence: Math.max(70, Math.min(99, data.confidence || 85)),
        reasoning: data.reasoning || 'AI-generated recommendation based on return analysis'
      };
    } catch (error) {
      console.error('💥 AI Service Error:', error);
      return this.getFallbackRecommendation(request);
    }
  }

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
