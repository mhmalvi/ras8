
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
      smartRecommendations: true,
      riskAnalysis: true,
      predictiveAnalytics: false,
      autoComm: false
    },
    lastUpdate: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAIStatus = async () => {
    if (!profile?.merchant_id) return;

    try {
      setLoading(true);

      // Test edge function connectivity
      const { data: testResponse, error: testError } = await supabase.functions
        .invoke('generate-exchange-recommendation', {
          body: {
            returnReason: 'test',
            productName: 'test',
            customerEmail: 'test@test.com',
            orderValue: 100
          }
        });

      const edgeFunctionsActive = !testError && testResponse;

      // Get AI performance metrics
      const { data: aiSuggestions, error: suggestionsError } = await supabase
        .from('ai_suggestions')
        .select('accepted, confidence_score')
        .not('return_id', 'is', null);

      if (suggestionsError) throw suggestionsError;

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
        processingEfficiency: Math.round(avgConfidence),
        featuresEnabled: {
          smartRecommendations: edgeFunctionsActive,
          riskAnalysis: edgeFunctionsActive,
          predictiveAnalytics: false,
          autoComm: false
        },
        lastUpdate: new Date().toISOString()
      });

      setError(null);
    } catch (err) {
      console.error('Error checking AI status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testAIFeature = async (feature: string) => {
    try {
      switch (feature) {
        case 'recommendation':
          const { data, error } = await supabase.functions.invoke('generate-exchange-recommendation', {
            body: {
              returnReason: 'Size too small',
              productName: 'Test Product',
              customerEmail: 'test@example.com',
              orderValue: 99.99
            }
          });
          
          if (error) throw error;
          return { success: true, data };

        case 'risk-analysis':
          const { data: riskData, error: riskError } = await supabase.functions.invoke('analyze-return-risk', {
            body: {
              returnId: 'test-123',
              productName: 'Test Product',
              returnReason: 'Quality issue',
              customerEmail: 'test@example.com',
              orderValue: 150
            }
          });
          
          if (riskError) throw riskError;
          return { success: true, data: riskData };

        default:
          throw new Error('Unknown feature');
      }
    } catch (error) {
      console.error(`Error testing ${feature}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  useEffect(() => {
    if (profile?.merchant_id) {
      checkAIStatus();
    }
  }, [profile?.merchant_id]);

  return {
    status,
    loading,
    error,
    checkAIStatus,
    testAIFeature
  };
};
