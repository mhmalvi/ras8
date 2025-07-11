
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
    // Get counts from various tables
    const [returnsResult, aiSuggestionsResult] = await Promise.all([
      supabase.from('returns').select('id', { count: 'exact', head: true }),
      supabase.from('ai_suggestions').select('id', { count: 'exact', head: true })
    ]);

    return {
      totalReturns: returnsResult.count || 0,
      aiSuggestions: aiSuggestionsResult.count || 0,
      processingRate: 95, // Mock data
      customerSatisfaction: 4.2 // Mock data
    };
  }
}
