
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      customerHistory 
    } = await req.json();

    console.log('Analyzing return risk for:', returnId);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured',
        fallback: true,
        data: {
          riskLevel: 'low',
          fraudProbability: 0.05,
          customerSatisfactionScore: 75,
          recommendedAction: 'approve',
          reasoning: 'Fallback analysis - API key not configured'
        }
      } as StandardResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    const systemPrompt = `You are an AI risk assessment specialist for e-commerce returns. Analyze return requests for fraud indicators, customer behavior patterns, and business risk factors.

Your analysis should consider:
- Return reason legitimacy
- Customer history and behavior patterns
- Order value vs. typical patterns
- Timing and frequency of returns
- Product type risk factors

Response format: JSON with riskLevel (low/medium/high), fraudProbability (0-1), customerSatisfactionScore (0-100), recommendedAction (approve/investigate/reject), and reasoning.`;

    const userPrompt = `Analyze this return for risk factors:

Return ID: ${returnId}
Product: ${productName}
Return Reason: ${returnReason}
Customer: ${customerEmail}
Order Value: $${orderValue}
${customerHistory ? `Customer History: ${JSON.stringify(customerHistory)}` : 'No history available'}

Assess:
1. Overall risk level (low, medium, high)
2. Fraud probability (0.0 to 1.0)
3. Customer satisfaction score (0-100)
4. Recommended action (approve, investigate, reject)
5. Detailed reasoning

Consider red flags like:
- Unusually high return frequency
- Recent account creation with high-value returns
- Vague or inconsistent return reasons
- Multiple returns of same product type
- Geographic or timing anomalies`;

    console.log('Making OpenAI API request for risk analysis...');
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
        temperature: 0.2,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    console.log('OpenAI risk analysis response received:', content.substring(0, 100) + '...');

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      console.warn('Failed to parse AI response as JSON, using fallback');
      analysis = {
        riskLevel: orderValue > 500 ? 'medium' : 'low',
        fraudProbability: 0.1,
        customerSatisfactionScore: 75,
        recommendedAction: 'approve',
        reasoning: 'Standard risk assessment - AI response parsing failed'
      };
    }

    // Validate and normalize response
    const responseData = {
      riskLevel: ['low', 'medium', 'high'].includes(analysis.riskLevel) ? analysis.riskLevel : 'low',
      fraudProbability: Math.max(0, Math.min(1, analysis.fraudProbability || 0.1)),
      customerSatisfactionScore: Math.max(0, Math.min(100, analysis.customerSatisfactionScore || 75)),
      recommendedAction: ['approve', 'investigate', 'reject'].includes(analysis.recommendedAction) 
        ? analysis.recommendedAction : 'approve',
      reasoning: analysis.reasoning || 'Risk assessment completed'
    };

    const result = {
      success: true,
      fallback: false,
      data: responseData
    } as StandardResponse;

    console.log('Risk analysis result:', result.data);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in risk analysis function:', error);
    
    const fallbackResponse = {
      success: false,
      error: error.message,
      fallback: true,
      data: {
        riskLevel: 'low',
        fraudProbability: 0.05,
        customerSatisfactionScore: 70,
        recommendedAction: 'approve',
        reasoning: 'Fallback risk analysis due to processing error'
      }
    } as StandardResponse;

    return new Response(JSON.stringify(fallbackResponse), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
