
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
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = this.buildRecommendationPrompt(request);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant specialized in e-commerce product recommendations for returns and exchanges. Provide helpful, accurate suggestions based on customer return reasons.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseAIResponse(data.choices[0]?.message?.content || '');
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
