
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
    lastUpdate: null
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

      // Test edge function connectivity with a simple test
      const { data: testResponse, error: testError } = await supabase.functions
        .invoke('generate-exchange-recommendation', {
          body: {
            returnReason: 'Size too small - testing API key',
            productName: 'Test Product',
            customerEmail: 'test@example.com',
            orderValue: 100
          }
        });

      const edgeFunctionsActive = !testError && testResponse?.suggestedProduct;

      console.log('AI Edge Function Test:', { 
        success: edgeFunctionsActive, 
        error: testError?.message,
        response: testResponse
      });

      // Get AI performance metrics from actual data
      const { data: aiSuggestions, error: suggestionsError } = await supabase
        .from('ai_suggestions')
        .select('accepted, confidence_score')
        .not('return_id', 'is', null);

      if (suggestionsError && suggestionsError.code !== 'PGRST116') {
        console.warn('Error fetching AI suggestions:', suggestionsError);
      }

      let aiAcceptanceRate = 0;
      let avgConfidence = 0;

      if (aiSuggestions && aiSuggestions.length > 0) {
        const acceptedCount = aiSuggestions.filter(s => s.accepted === true).length;
        aiAcceptanceRate = (acceptedCount / aiSuggestions.length) * 100;
        
        avgConfidence = aiSuggestions.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / aiSuggestions.length;
      }

      setStatus({
        edgeFunctionsActive,
        aiAcceptanceRate: Math.round(aiAcceptanceRate),
        processingEfficiency: Math.round(avgConfidence * 100),
        featuresEnabled: {
          smartRecommendations: edgeFunctionsActive,
          riskAnalysis: edgeFunctionsActive,
          predictiveAnalytics: edgeFunctionsActive,
          autoComm: edgeFunctionsActive
        },
        lastUpdate: new Date().toISOString()
      });

    } catch (err) {
      console.error('Error checking AI status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Set fallback status
      setStatus(prev => ({
        ...prev,
        edgeFunctionsActive: false,
        lastUpdate: new Date().toISOString()
      }));
    } finally {
      setLoading(false);
    }
  };

  const testAIFeature = async (feature: string) => {
    try {
      console.log(`Testing AI feature: ${feature}`);
      
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
          
          console.log('Recommendation test result:', data);
          return { 
            success: !!data?.suggestedProduct, 
            data,
            message: `Suggested: ${data?.suggestedProduct}` 
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
          
          console.log('Risk analysis test result:', riskData);
          return { 
            success: !!riskData?.riskLevel, 
            data: riskData,
            message: `Risk Level: ${riskData?.riskLevel}` 
          };

        default:
          throw new Error('Unknown feature');
      }
    } catch (error) {
      console.error(`Error testing ${feature}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  useEffect(() => {
    checkAIStatus();
  }, [profile?.merchant_id]);

  return {
    status,
    loading,
    error,
    checkAIStatus,
    testAIFeature
  };
};
