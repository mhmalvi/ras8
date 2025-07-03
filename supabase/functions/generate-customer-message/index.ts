
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import 'https://deno.land/x/xhr@0.1.0/mod.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { 
      returnId,
      customerEmail, 
      returnReason, 
      returnStatus,
      messageType = 'update',
      customPrompt,
      productName = 'Product'
    } = await req.json()

    console.log('🤖 Generating customer message:', { returnId, messageType, customerEmail })

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    let systemPrompt = ''
    let userPrompt = ''

    switch (messageType) {
      case 'update':
        systemPrompt = 'You are a professional customer service representative writing status update emails. Be friendly, informative, and reassuring.'
        userPrompt = `Write a professional status update email for a customer whose return is currently "${returnStatus}". The return reason was "${returnReason}" for product "${productName}". Keep it concise, friendly, and include next steps.`
        break
      
      case 'followup':
        systemPrompt = 'You are a customer service representative following up on a completed return. Be warm and ask for feedback.'
        userPrompt = `Write a follow-up email for a customer whose return for "${productName}" has been processed. The original reason was "${returnReason}". Ask for feedback and offer future assistance.`
        break
      
      case 'apology':
        systemPrompt = 'You are writing a sincere apology email. Be empathetic and show that the company takes responsibility.'
        userPrompt = `Write a sincere apology email for the inconvenience caused. The return reason was "${returnReason}" for "${productName}". Acknowledge the issue and outline steps taken to prevent it in the future.`
        break
      
      case 'custom':
        systemPrompt = 'You are a professional customer service representative. Write personalized, helpful emails based on the specific instructions provided.'
        userPrompt = customPrompt || `Write a professional customer communication email regarding the return of "${productName}". The return reason was "${returnReason}".`
        break
      
      default:
        systemPrompt = 'You are a helpful customer service representative.'
        userPrompt = `Write a professional email regarding the return of "${productName}". The return reason was "${returnReason}".`
    }

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const message = data.choices?.[0]?.message?.content

    if (!message) {
      throw new Error('No message generated from OpenAI')
    }

    console.log('✅ Customer message generated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: message.trim(),
        messageType,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('💥 Error in generate-customer-message function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        message: 'Failed to generate customer message'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
