
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from './useProfile';

interface AIIntegrationStatus {
  edgeFunctionsActive: boolean;
  aiAcceptanceRate: number;
  processingEfficiency: number;
  featuresEnabled: {
    smartRecommendations: boolean;
    riskAnalysis: boolean;
    predictiveAnalytics: boolean;
    autoComm: boolean;
  };
  lastUpdate: string | null;
  apiKeyConfigured: boolean;
  lastError: string | null;
}

interface StandardAIResponse {
  success: boolean;
  data?: any;
  error?: string;
  fallback?: boolean;
}

export const useAIIntegration = () => {
  const { profile } = useProfile();
  const [status, setStatus] = useState<AIIntegrationStatus>({
    edgeFunctionsActive: false,
    aiAcceptanceRate: 0,
    processingEfficiency: 0,
    featuresEnabled: {
      smartRecommendations: false,
      riskAnalysis: false,
      predictiveAnalytics: false,
      autoComm: false
    },
    lastUpdate: null,
    apiKeyConfigured: false,
    lastError: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAIStatus = async () => {
    if (!profile?.merchant_id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Checking AI integration status...');

      // Test edge function connectivity with standardized response handling
      const { data: testResponse, error: testError } = await supabase.functions
        .invoke('generate-exchange-recommendation', {
          body: {
            returnReason: 'Size too small - testing API integration',
            productName: 'Test Product',
            customerEmail: 'test@example.com',
            orderValue: 100
          }
        });

      console.log('🤖 AI Test Response:', { testResponse, testError });

      let edgeFunctionsActive = false;
      let apiKeyConfigured = false;
      let lastError = null;

      if (!testError && testResponse) {
        const aiResponse = testResponse as StandardAIResponse;
        
        if (aiResponse.success && !aiResponse.fallback) {
          edgeFunctionsActive = true;
          apiKeyConfigured = true;
          console.log('✅ AI functions working with real OpenAI data');
        } else if (aiResponse.fallback) {
          edgeFunctionsActive = true;
          apiKeyConfigured = false;
          lastError = aiResponse.error || 'Using fallback responses - API key may not be configured';
          console.log('⚠️ AI functions working but using fallback data');
        } else {
          lastError = aiResponse.error || 'AI function returned unsuccessful response';
          console.log('❌ AI functions not working properly');
        }
      } else {
        lastError = testError?.message || 'Failed to invoke AI function';
        console.log('💥 Error invoking AI function:', testError);
      }

      // Get AI performance metrics from actual data
      const { data: aiSuggestions, error: suggestionsError } = await supabase
        .from('ai_suggestions')
        .select('accepted, confidence_score')
        .not('return_id', 'is', null);

      if (suggestionsError && suggestionsError.code !== 'PGRST116') {
        console.warn('⚠️ Error fetching AI suggestions:', suggestionsError);
      }

      let aiAcceptanceRate = 0;
      let avgConfidence = 0;

      if (aiSuggestions && aiSuggestions.length > 0) {
        const acceptedCount = aiSuggestions.filter(s => s.accepted === true).length;
        aiAcceptanceRate = (acceptedCount / aiSuggestions.length) * 100;
        
        avgConfidence = aiSuggestions.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / aiSuggestions.length;
        console.log('📊 AI Performance:', { aiAcceptanceRate, avgConfidence, totalSuggestions: aiSuggestions.length });
      }

      setStatus({
        edgeFunctionsActive,
        apiKeyConfigured,
        aiAcceptanceRate: Math.round(aiAcceptanceRate),
        processingEfficiency: Math.round(avgConfidence * 100),
        featuresEnabled: {
          smartRecommendations: edgeFunctionsActive && apiKeyConfigured,
          riskAnalysis: edgeFunctionsActive && apiKeyConfigured,
          predictiveAnalytics: edgeFunctionsActive && apiKeyConfigured,
          autoComm: edgeFunctionsActive && apiKeyConfigured
        },
        lastUpdate: new Date().toISOString(),
        lastError
      });

    } catch (err) {
      console.error('💥 Error checking AI status:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Set fallback status
      setStatus(prev => ({
        ...prev,
        edgeFunctionsActive: false,
        apiKeyConfigured: false,
        lastUpdate: new Date().toISOString(),
        lastError: errorMessage
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAIFeature = async (feature: string) => {
    try {
      console.log(`🧪 Testing AI feature: ${feature}`);
      
      switch (feature) {
        case 'recommendation':
          const { data, error } = await supabase.functions.invoke('generate-exchange-recommendation', {
            body: {
              returnReason: 'Quality issue - testing recommendation engine',
              productName: 'Premium T-Shirt',
              customerEmail: 'test@example.com',
              orderValue: 49.99
            }
          });
          
          if (error) throw error;
          
          const response = data as StandardAIResponse;
          console.log('🎯 Recommendation test result:', response);
          
          return { 
            success: response.success && !response.fallback, 
            data: response.data,
            message: response.success 
              ? `Suggested: ${response.data?.suggestedProduct}${response.fallback ? ' (Fallback)' : ''}` 
              : response.error || 'Test failed',
            fallback: response.fallback || false
          };

        case 'risk-analysis':
          const { data: riskData, error: riskError } = await supabase.functions.invoke('analyze-return-risk', {
            body: {
              returnId: 'test-risk-analysis',
              productName: 'Test Product',
              returnReason: 'Testing risk analysis system',
              customerEmail: 'test@example.com',
              orderValue: 150
            }
          });
          
          if (riskError) throw riskError;
          
          const riskResponse = riskData as StandardAIResponse;
          console.log('🔍 Risk analysis test result:', riskResponse);
          
          return { 
            success: riskResponse.success && !riskResponse.fallback, 
            data: riskResponse.data,
            message: riskResponse.success 
              ? `Risk Level: ${riskResponse.data?.riskLevel}${riskResponse.fallback ? ' (Fallback)' : ''}` 
              : riskResponse.error || 'Test failed',
            fallback: riskResponse.fallback || false
          };

        default:
          throw new Error('Unknown feature');
      }
    } catch (error) {
      console.error(`💥 Error testing ${feature}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        fallback: false
      };
    }
  };

  useEffect(() => {
    checkAIStatus();
    
    // Set up periodic status checks every 5 minutes
    const interval = setInterval(checkAIStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [profile?.merchant_id]);

  return {
    status,
    loading,
    error,
    checkAIStatus,
    testAIFeature
  };
};
