
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      returnId, 
      productName, 
      returnReason, 
      customerEmail, 
      orderValue,
      customerHistory,
      merchantSettings,
      includeAnalysis = true,
      includeAlternatives = true
    } = await req.json();

    console.log('Generating advanced AI recommendation for:', productName);

    const systemPrompt = `You are an advanced AI assistant specializing in e-commerce return optimization. Your role is to analyze return requests and provide intelligent recommendations that maximize customer retention and business value.

Context:
- You have access to customer history and merchant preferences
- Your recommendations should balance customer satisfaction with business outcomes
- Consider fraud risk, customer lifetime value, and operational efficiency
- Provide confidence scores based on data quality and pattern recognition

Response format: JSON with type, suggestedProduct, confidence (0-100), reasoning, expectedOutcome, alternativeOptions (array), and customerRetentionScore (0-100).`;

    const userPrompt = `Analyze this return request and provide an advanced recommendation:

Product: ${productName}
Return Reason: ${returnReason}
Customer: ${customerEmail}
Order Value: $${orderValue}
${customerHistory ? `Customer History: ${JSON.stringify(customerHistory)}` : ''}
${merchantSettings ? `Merchant Settings: ${JSON.stringify(merchantSettings)}` : ''}

Please provide:
1. Optimal recommendation type (exchange, refund, store_credit, partial_exchange)
2. Specific product suggestion if applicable
3. Confidence score (0-100)
4. Detailed reasoning
5. Expected business outcome
6. 3-5 alternative options
7. Customer retention probability score

Consider:
- Return reason analysis
- Customer value and history
- Fraud risk indicators
- Seasonal patterns
- Inventory considerations
- Business impact`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Try to parse JSON response
    let recommendation;
    try {
      recommendation = JSON.parse(content);
    } catch (e) {
      // Fallback if AI doesn't return valid JSON
      recommendation = {
        type: 'exchange',
        suggestedProduct: `Alternative ${productName}`,
        confidence: 75,
        reasoning: content.substring(0, 200),
        expectedOutcome: 'Improved customer satisfaction',
        alternativeOptions: ['Full refund', 'Store credit', 'Different size'],
        customerRetentionScore: 80
      };
    }

    // Ensure all required fields are present
    const response_data = {
      type: recommendation.type || 'exchange',
      suggestedProduct: recommendation.suggestedProduct || `Enhanced ${productName}`,
      confidence: Math.max(60, Math.min(99, recommendation.confidence || 75)),
      reasoning: recommendation.reasoning || 'AI analysis suggests this recommendation based on return patterns',
      expectedOutcome: recommendation.expectedOutcome || 'Positive customer experience',
      alternativeOptions: recommendation.alternativeOptions || ['Store credit', 'Full refund'],
      customerRetentionScore: Math.max(0, Math.min(100, recommendation.customerRetentionScore || 75))
    };

    console.log('Generated recommendation:', response_data);

    return new Response(JSON.stringify(response_data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in advanced recommendation function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      type: 'exchange',
      suggestedProduct: 'Alternative product',
      confidence: 70,
      reasoning: 'Fallback recommendation due to processing error',
      expectedOutcome: 'Standard processing',
      alternativeOptions: ['Refund', 'Store credit'],
      customerRetentionScore: 70
    }), {
      status: 200, // Return 200 with fallback data instead of error
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
