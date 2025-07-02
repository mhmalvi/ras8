
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
        throw new Error(`Edge function error: ${error.message}`);
      }

      return {
        suggestedProduct: data.suggestedProduct,
        confidence: data.confidence,
        reasoning: data.reasoning
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
    // Fallback logic when AI service is unavailable
    const fallbackProducts = [
      'Premium Version',
      'Enhanced Model',
      'Alternative Style',
      'Upgraded Version',
      'Different Size Option'
    ];

    const randomProduct = fallbackProducts[Math.floor(Math.random() * fallbackProducts.length)];
    
    return {
      suggestedProduct: `${randomProduct} of ${request.productName}`,
      confidence: 75,
      reasoning: 'Recommendation based on common exchange patterns for similar return reasons.'
    };
  }
}

export const aiService = new AIService();
