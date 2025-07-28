import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

// Enhanced CORS configuration
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { returnId, productId, customerEmail, reason, orderValue, returnReason, productName } = await req.json();

    // More flexible validation - returnId is essential, but we can work with other fields
    if (!returnId) {
      throw new Error('Missing required field: returnId');
    }

    // Provide defaults for missing fields
    const effectiveProductId = productId || 'unknown-product';
    const effectiveReason = reason || returnReason || 'Not specified';
    const effectiveCustomerEmail = customerEmail || 'customer@example.com';
    const effectiveOrderValue = orderValue || 0;

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Fetch product details and similar products from the merchant's catalog
    const { data: returnData, error: returnError } = await supabase
      .from('returns')
      .select(`
        *,
        return_items (
          *
        )
      `)
      .eq('id', returnId)
      .single();

    if (returnError) {
      throw new Error(`Failed to fetch return data: ${returnError.message}`);
    }

    // Generate AI recommendation using OpenAI
    const prompt = `
As an e-commerce return specialist, analyze this return request and suggest the best exchange options:

Return Details:
- Product ID: ${effectiveProductId}
- Product Name: ${productName || 'Unknown Product'}
- Return Reason: ${effectiveReason}
- Customer Email: ${effectiveCustomerEmail}
- Order Value: $${effectiveOrderValue}

Based on this information, provide:
1. 3 specific exchange recommendations with reasoning
2. Confidence score (0-1) for each recommendation
3. Overall assessment of customer satisfaction potential
4. Estimated revenue retention impact

Respond in JSON format:
{
  "recommendations": [
    {
      "productSuggestion": "Product name/description",
      "reasoning": "Why this is a good exchange",
      "confidenceScore": 0.85,
      "estimatedValue": "$XX"
    }
  ],
  "overallConfidence": 0.8,
  "customerSatisfactionPotential": "high|medium|low",
  "revenueRetentionEstimate": "$XX",
  "additionalNotes": "Any special considerations"
}
`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce return specialist focused on maximizing customer satisfaction and revenue retention through smart exchange recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    let aiSuggestion;
    
    try {
      aiSuggestion = JSON.parse(openaiData.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      aiSuggestion = {
        recommendations: [{
          productSuggestion: "Similar product in different size/color",
          reasoning: "Based on return reason, this alternative may better meet customer needs",
          confidenceScore: 0.7,
          estimatedValue: orderValue || "$50"
        }],
        overallConfidence: 0.7,
        customerSatisfactionPotential: "medium",
        revenueRetentionEstimate: orderValue || "$50",
        additionalNotes: "AI analysis generated fallback recommendation"
      };
    }

    // Store the AI suggestion in the database
    const { data: suggestionData, error: suggestionError } = await supabase
      .from('ai_suggestions')
      .insert({
        return_id: returnId,
        suggestion_type: 'exchange_recommendation',
        suggestion: JSON.stringify(aiSuggestion),
        confidence_score: aiSuggestion.overallConfidence || 0.7,
        metadata: {
          productId: effectiveProductId,
          productName,
          reason: effectiveReason,
          customerEmail: effectiveCustomerEmail,
          orderValue: effectiveOrderValue,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (suggestionError) {
      console.error('Failed to store AI suggestion:', suggestionError);
      // Continue anyway, don't fail the entire request
    }

    console.log('✅ Exchange recommendation generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        suggestion: aiSuggestion,
        suggestionId: suggestionData?.id,
        confidence: aiSuggestion.overallConfidence || 0.7
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error generating exchange recommendation:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        fallbackSuggestion: {
          recommendations: [{
            productSuggestion: "Store credit or refund",
            reasoning: "Unable to generate specific product recommendations at this time",
            confidenceScore: 0.5,
            estimatedValue: "Original order value"
          }],
          overallConfidence: 0.5,
          customerSatisfactionPotential: "medium",
          additionalNotes: "Fallback recommendation due to system error"
        }
      }),
      {
        status: 200, // Return 200 with error details for graceful degradation
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});