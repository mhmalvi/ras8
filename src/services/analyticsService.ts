
import { supabase } from '@/integrations/supabase/client';
import { invokeEdgeFunction } from '@/utils/edgeFunctionHelper';

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  event_data: any;
  merchant_id: string;
  created_at: string;
}

export interface AnalyticsInsight {
  title: string;
  description: string;
  metric: string;
  change: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

export class AnalyticsService {
  /**
   * Track analytics event
   */
  static async trackEvent(eventType: string, eventData: any): Promise<void> {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        event_data: eventData
      });

    if (error) {
      console.error('Error tracking analytics event:', error);
    }
  }

  /**
   * Get analytics data for timeframe
   */
  static async getAnalytics(timeRange: string = '30days'): Promise<AnalyticsEvent[]> {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch analytics: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Generate AI-powered analytics insights
   */
  static async generateInsights(timeframe: string = '30days', customAnalysis?: string) {
    return invokeEdgeFunction<{ insights: AnalyticsInsight[]; summary: string }>('generate-analytics-insights', {
      timeframe,
      customAnalysis
    });
  }

  /**
   * Predict return trends using AI
   */
  static async predictReturnTrends(historicalData?: any[], analysisType: string = 'basic') {
    return invokeEdgeFunction('predict-return-trends', {
      historicalData,
      analysisType
    });
  }

  /**
   * Get real-time metrics
   */
  static async getRealTimeMetrics() {
    try {
      // Get comprehensive data from various tables
      const [returnsResult, aiSuggestionsResult, completedReturnsResult, analyticsResult] = await Promise.all([
        supabase.from('returns').select('id', { count: 'exact', head: true }),
        supabase.from('ai_suggestions').select('id', { count: 'exact', head: true }),
        supabase.from('returns').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('analytics_events').select('event_type, event_data').order('created_at', { ascending: false }).limit(100)
      ]);

      if (returnsResult.error || aiSuggestionsResult.error || completedReturnsResult.error || analyticsResult.error) {
        throw new Error('Failed to fetch real-time metrics data');
      }

      const totalReturns = returnsResult.count || 0;
      const completedReturns = completedReturnsResult.count || 0;
      
      // Calculate real processing rate based on completed vs total returns
      const processingRate = totalReturns > 0 ? Math.round((completedReturns / totalReturns) * 100) : 0;
      
      // Calculate customer satisfaction from analytics events
      const analyticsData = analyticsResult.data || [];
      const satisfactionEvents = analyticsData.filter(event => 
        event.event_type === 'customer_satisfaction' || 
        event.event_type === 'return_completed' ||
        event.event_type === 'exchange_accepted'
      );
      
      let customerSatisfaction = 0;
      if (satisfactionEvents.length > 0) {
        const satisfactionScores = satisfactionEvents
          .map(event => {
            if (event.event_data && typeof event.event_data === 'object') {
              const data = event.event_data as Record<string, any>;
              return data.satisfaction_score || data.value || 0;
            }
            return 0;
          })
          .filter(score => score > 0);
        
        if (satisfactionScores.length > 0) {
          customerSatisfaction = satisfactionScores.reduce((sum, score) => sum + score, 0) / satisfactionScores.length;
        }
      }
      
      // If no satisfaction data exists, calculate based on completion rate
      if (customerSatisfaction === 0) {
        customerSatisfaction = Math.min(5.0, Math.max(1.0, 3.5 + (processingRate / 100) * 1.5));
      }

      return {
        totalReturns,
        aiSuggestions: aiSuggestionsResult.count || 0,
        processingRate,
        customerSatisfaction: Math.round(customerSatisfaction * 10) / 10 // Round to 1 decimal
      };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw new Error(`Failed to get real-time metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
