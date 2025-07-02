
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
      // Use Supabase edge function instead of direct API calls
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
        console.warn('Edge function error, using fallback:', error.message);
        return this.getFallbackRecommendation(request);
      }

      return {
        suggestedProduct: data.suggestedProduct || data.suggestion,
        confidence: data.confidence || 85,
        reasoning: data.reasoning || 'AI-generated recommendation based on return analysis'
      };
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackRecommendation(request);
    }
  }

  private buildRecommendationPrompt(request: AIRecommendationRequest): string {
    return `
Customer Return Analysis:
- Product: ${request.productName}
- Return Reason: ${request.returnReason}
- Order Value: $${request.orderValue}
- Customer: ${request.customerEmail}

Task: Suggest a better product for exchange that would address the customer's concern.

Requirements:
1. Suggest ONE primary product for exchange
2. Provide a confidence score (70-99%)
3. Explain the reasoning in 1-2 sentences
4. Consider the return reason when making suggestions

Return format:
PRODUCT: [suggested product name]
CONFIDENCE: [number between 70-99]
REASONING: [brief explanation]
`;
  }

  private parseAIResponse(content: string): AIRecommendationResponse {
    const lines = content.split('\n');
    let suggestedProduct = '';
    let confidence = 85;
    let reasoning = '';

    lines.forEach(line => {
      if (line.startsWith('PRODUCT:')) {
        suggestedProduct = line.replace('PRODUCT:', '').trim();
      } else if (line.startsWith('CONFIDENCE:')) {
        const confMatch = line.match(/\d+/);
        if (confMatch) confidence = parseInt(confMatch[0]);
      } else if (line.startsWith('REASONING:')) {
        reasoning = line.replace('REASONING:', '').trim();
      }
    });

    return {
      suggestedProduct: suggestedProduct || 'Enhanced Version of Original Product',
      confidence: Math.max(70, Math.min(99, confidence)),
      reasoning: reasoning || 'Based on the return reason, this alternative should better meet customer needs.'
    };
  }

  private getFallbackRecommendation(request: AIRecommendationRequest): AIRecommendationResponse {
    // Improved fallback logic based on return reason
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
        confidence: 85,
        reasoning: 'Size-related return suggests customer needs a different size option.'
      };
    }
    
    if (reasonLower.includes('quality') || reasonLower.includes('defective')) {
      return {
        suggestedType: 'Premium Quality',
        confidence: 90,
        reasoning: 'Quality concerns indicate customer would benefit from a higher-grade product.'
      };
    }
    
    if (reasonLower.includes('color') || reasonLower.includes('style')) {
      return {
        suggestedType: 'Alternative Style',
        confidence: 80,
        reasoning: 'Aesthetic preferences suggest offering a different style or color variant.'
      };
    }
    
    if (reasonLower.includes('too expensive') || reasonLower.includes('price')) {
      return {
        suggestedType: 'Budget-Friendly',
        confidence: 75,
        reasoning: 'Price sensitivity indicates customer would prefer a more affordable alternative.'
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
