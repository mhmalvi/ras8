
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StandardResponse {
  success: boolean;
  data?: any;
  error?: string;
  fallback?: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { returnReason, productName, customerEmail, orderValue } = await req.json();

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured',
        fallback: true,
        data: {
          suggestedProduct: `Enhanced ${productName}`,
          confidence: 75,
          reasoning: 'Fallback recommendation - API key not configured'
        }
      } as StandardResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const prompt = `
Customer Return Analysis:
- Product: ${productName}
- Return Reason: ${returnReason}
- Order Value: $${orderValue}
- Customer: ${customerEmail}

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

    console.log('Making OpenAI API request...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
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
      }),
    });

    if (!response.ok) {
      console.error(`OpenAI API error: ${response.statusText}`);
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    console.log('OpenAI response received:', content.substring(0, 100) + '...');

    // Parse the AI response
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

    const result = {
      success: true,
      fallback: false,
      data: {
        suggestedProduct: suggestedProduct || 'Enhanced Version of Original Product',
        confidence: Math.max(70, Math.min(99, confidence)),
        reasoning: reasoning || 'Based on the return reason, this alternative should better meet customer needs.'
      }
    } as StandardResponse;

    console.log('Sending successful response:', result.data);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-exchange-recommendation function:', error);
    
    const fallbackProducts = [
      'Premium Version',
      'Enhanced Model',
      'Alternative Style',
      'Upgraded Version',
      'Different Size Option'
    ];

    const randomProduct = fallbackProducts[Math.floor(Math.random() * fallbackProducts.length)];
    
    const fallbackResponse = {
      success: false,
      error: error.message,
      fallback: true,
      data: {
        suggestedProduct: `${randomProduct} of the original product`,
        confidence: 75,
        reasoning: 'Fallback recommendation due to API error - based on common exchange patterns'
      }
    } as StandardResponse;

    return new Response(JSON.stringify(fallbackResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});
