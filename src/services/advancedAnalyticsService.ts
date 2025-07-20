
import { supabase } from '@/integrations/supabase/client';

export interface AdvancedMetrics {
  totalReturns: number;
  totalExchanges: number;
  totalRefunds: number;
  aiAcceptanceRate: number;
  revenueImpact: number;
  averageProcessingTime: number;
  returnRate: number;
  customerSatisfactionScore: number;
  monthOverMonthGrowth: {
    returns: number;
    exchanges: number;
    revenue: number;
  };
  topReturnReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  seasonalTrends: Array<{
    period: string;
    returns: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  predictiveInsights: {
    nextMonthReturns: number;
    riskFactors: string[];
    opportunities: string[];
  };
}

export class AdvancedAnalyticsService {
  static async getAdvancedMetrics(merchantId: string): Promise<AdvancedMetrics> {
    console.log('📊 Calculating advanced metrics for merchant:', merchantId);

    try {
      // Fetch comprehensive data with optimized queries
      const [returnsData, itemsData, aiData, ordersData] = await Promise.all([
        supabase
          .from('returns')
          .select('*')
          .eq('merchant_id', merchantId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('return_items')
          .select(`
            *,
            returns!inner (merchant_id, created_at, status)
          `)
          .eq('returns.merchant_id', merchantId),
        
        supabase
          .from('ai_suggestions')
          .select(`
            *,
            returns!inner (merchant_id)
          `)
          .eq('returns.merchant_id', merchantId),
        
        supabase
          .from('orders')
          .select('*')
          .limit(1000) // Get recent orders for return rate calculation
      ]);

      if (returnsData.error) throw returnsData.error;
      if (itemsData.error) throw itemsData.error;
      if (aiData.error) throw aiData.error;

      const returns = returnsData.data || [];
      const items = itemsData.data || [];
      const aiSuggestions = aiData.data || [];
      const orders = ordersData.data || [];

      // Calculate advanced metrics
      const metrics = this.calculateAdvancedMetrics(returns, items, aiSuggestions, orders);
      
      console.log('✅ Advanced metrics calculated:', metrics);
      return metrics;
    } catch (error) {
      console.error('💥 Error calculating advanced metrics:', error);
      throw error;
    }
  }

  private static calculateAdvancedMetrics(
    returns: any[], 
    items: any[], 
    aiSuggestions: any[], 
    orders: any[]
  ): AdvancedMetrics {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);

    // Basic counts
    const totalReturns = returns.length;
    const totalExchanges = items.filter(item => item.action === 'exchange').length;
    const totalRefunds = items.filter(item => item.action === 'refund').length;

    // AI metrics
    const acceptedAI = aiSuggestions.filter(ai => ai.accepted === true).length;
    const totalAI = aiSuggestions.length;
    const aiAcceptanceRate = totalAI > 0 ? (acceptedAI / totalAI) * 100 : 0;

    // Revenue impact
    const revenueImpact = items
      .filter(item => item.action === 'exchange')
      .reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    // Processing time calculation
    const completedReturns = returns.filter(r => r.status === 'completed');
    const averageProcessingTime = completedReturns.length > 0 
      ? completedReturns.reduce((sum, r) => {
          const created = new Date(r.created_at);
          const updated = new Date(r.updated_at);
          return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / completedReturns.length
      : 0;

    // Return rate calculation
    const returnRate = orders.length > 0 ? (totalReturns / orders.length) * 100 : 0;

    // Customer satisfaction score (based on AI acceptance and exchange rates)
    const exchangeRate = totalReturns > 0 ? (totalExchanges / totalReturns) * 100 : 0;
    const customerSatisfactionScore = Math.min(100, (aiAcceptanceRate * 0.3) + (exchangeRate * 0.7));

    // Month-over-month growth
    const currentMonthReturns = returns.filter(r => new Date(r.created_at) >= lastMonth);
    const previousMonthReturns = returns.filter(r => {
      const date = new Date(r.created_at);
      return date >= twoMonthsAgo && date < lastMonth;
    });

    const monthOverMonthGrowth = {
      returns: this.calculateGrowthRate(currentMonthReturns.length, previousMonthReturns.length),
      exchanges: this.calculateGrowthRate(
        items.filter(i => i.action === 'exchange' && new Date(i.returns?.created_at) >= lastMonth).length,
        items.filter(i => i.action === 'exchange' && new Date(i.returns?.created_at) >= twoMonthsAgo && new Date(i.returns?.created_at) < lastMonth).length
      ),
      revenue: this.calculateGrowthRate(
        items.filter(i => new Date(i.returns?.created_at) >= lastMonth).reduce((sum, i) => sum + (Number(i.price) || 0), 0),
        items.filter(i => new Date(i.returns?.created_at) >= twoMonthsAgo && new Date(i.returns?.created_at) < lastMonth).reduce((sum, i) => sum + (Number(i.price) || 0), 0)
      )
    };

    // Top return reasons
    const reasonCounts = returns.reduce((acc, r) => {
      acc[r.reason] = (acc[r.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReturnReasons = Object.entries(reasonCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: (count / totalReturns) * 100
      }));

    // Seasonal trends (last 6 months)
    const seasonalTrends = this.calculateSeasonalTrends(returns);

    // Predictive insights
    const predictiveInsights = this.generatePredictiveInsights(returns, items, aiSuggestions);

    return {
      totalReturns,
      totalExchanges,
      totalRefunds,
      aiAcceptanceRate,
      revenueImpact,
      averageProcessingTime,
      returnRate,
      customerSatisfactionScore,
      monthOverMonthGrowth,
      topReturnReasons,
      seasonalTrends,
      predictiveInsights
    };
  }

  private static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private static calculateSeasonalTrends(returns: any[]) {
    const now = new Date();
    const trends = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthReturns = returns.filter(r => {
        const returnDate = new Date(r.created_at);
        return returnDate >= monthStart && returnDate <= monthEnd;
      }).length;

      const prevMonthReturns = i < 5 ? trends[trends.length - 1]?.returns || 0 : monthReturns;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (monthReturns > prevMonthReturns * 1.1) trend = 'up';
      else if (monthReturns < prevMonthReturns * 0.9) trend = 'down';

      trends.push({
        period: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        returns: monthReturns,
        trend
      });
    }

    return trends;
  }

  private static generatePredictiveInsights(returns: any[], items: any[], aiSuggestions: any[]) {
    const recentTrend = returns.slice(0, 30).length;
    const previousTrend = returns.slice(30, 60).length;
    
    const nextMonthReturns = Math.max(0, Math.round(recentTrend * 1.1));
    
    const riskFactors = [];
    const opportunities = [];

    // Risk analysis
    if (recentTrend > previousTrend * 1.2) {
      riskFactors.push('Return volume increasing rapidly');
    }
    
    const lowAIAcceptance = (aiSuggestions.filter(ai => ai.accepted === true).length / aiSuggestions.length) < 0.5;
    if (lowAIAcceptance && aiSuggestions.length > 0) {
      riskFactors.push('Low AI recommendation acceptance');
    }

    // Opportunity analysis
    const exchangeRate = items.filter(i => i.action === 'exchange').length / items.length;
    if (exchangeRate > 0.3) {
      opportunities.push('High exchange rate indicates customer retention');
    }
    
    if (aiSuggestions.length > 10 && (aiSuggestions.filter(ai => ai.accepted === true).length / aiSuggestions.length) > 0.7) {
      opportunities.push('AI recommendations performing well');
    }

    return {
      nextMonthReturns,
      riskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risks detected'],
      opportunities: opportunities.length > 0 ? opportunities : ['Focus on improving return processes']
    };
  }
}
