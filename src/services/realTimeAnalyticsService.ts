
import { supabase } from '@/integrations/supabase/client';
import { PerformanceOptimizer } from '@/utils/performanceOptimizer';
import { MonitoringService } from '@/utils/monitoringService';

export interface RealTimeAnalytics {
  totalReturns: number;
  totalRefunds: number;
  totalExchanges: number;
  aiAcceptanceRate: number;
  revenueImpact: number;
  returnsByStatus: {
    requested: number;
    approved: number;
    in_transit: number;
    completed: number;
  };
  monthlyTrends: Array<{
    month: string;
    returns: number;
    exchanges: number;
    refunds: number;
    revenue: number;
  }>;
  topReturnReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
}

export class RealTimeAnalyticsService {
  static async getAnalytics(merchantId: string): Promise<RealTimeAnalytics> {
    return MonitoringService.monitorApiCall(
      'analytics_fetch',
      async () => {
        console.log('🔄 Fetching optimized analytics for merchant:', merchantId);

        try {
          // Use optimized analytics query with caching
          const analyticsData = await PerformanceOptimizer.getOptimizedAnalytics(merchantId);
          
          const analytics = this.calculateAnalytics(
            analyticsData.returns,
            analyticsData.returnItems,
            analyticsData.aiSuggestions
          );
          
          MonitoringService.info('Analytics calculation completed', {
            merchantId,
            totalReturns: analytics.totalReturns,
            calculationTime: Date.now()
          });
          
          return analytics;

        } catch (error) {
          MonitoringService.error('Analytics calculation failed', { merchantId, error });
          throw error;
        }
      },
      { merchantId }
    );
  }

  private static calculateAnalytics(
    returnsData: any[],
    returnItemsData: any[],
    aiSuggestionsData: any[]
  ): RealTimeAnalytics {
    // Calculate totals
    const totalReturns = returnsData.length;
    const totalRefunds = returnItemsData.filter(item => item.action === 'refund').length;
    const totalExchanges = returnItemsData.filter(item => item.action === 'exchange').length;

    // Calculate AI acceptance rate from real data
    const acceptedSuggestions = aiSuggestionsData.filter(s => s.accepted === true).length;
    const totalSuggestions = aiSuggestionsData.filter(s => s.accepted !== null).length;
    const aiAcceptanceRate = totalSuggestions > 0 ? Math.round((acceptedSuggestions / totalSuggestions) * 100) : 0;

    // Calculate revenue impact from actual exchanges
    const revenueImpact = returnItemsData
      .filter(item => item.action === 'exchange')
      .reduce((sum, item) => sum + (Number(item.price) || 0), 0);

    // Calculate status breakdown
    const returnsByStatus = {
      requested: returnsData.filter(r => r.status === 'requested').length,
      approved: returnsData.filter(r => r.status === 'approved').length,
      in_transit: returnsData.filter(r => r.status === 'in_transit').length,
      completed: returnsData.filter(r => r.status === 'completed').length,
    };

    // Calculate monthly trends from real data
    const monthlyTrends = this.calculateMonthlyTrends(returnsData, returnItemsData);

    // Calculate top return reasons
    const topReturnReasons = this.calculateTopReturnReasons(returnsData);

    return {
      totalReturns,
      totalRefunds,
      totalExchanges,
      aiAcceptanceRate,
      revenueImpact,
      returnsByStatus,
      monthlyTrends,
      topReturnReasons
    };
  }

  private static calculateMonthlyTrends(returnsData: any[], returnItemsData: any[]) {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        returns: 0,
        exchanges: 0,
        refunds: 0,
        revenue: 0
      };
    });

    // Count returns by month
    returnsData.forEach(ret => {
      const retDate = new Date(ret.created_at);
      const monthData = months.find(m => 
        m.monthIndex === retDate.getMonth() && m.year === retDate.getFullYear()
      );
      if (monthData) monthData.returns++;
    });

    // Count items and calculate revenue by month
    returnItemsData.forEach(item => {
      const itemDate = new Date(item.returns?.created_at);
      const monthData = months.find(m => 
        m.monthIndex === itemDate.getMonth() && m.year === itemDate.getFullYear()
      );
      if (monthData) {
        if (item.action === 'exchange') {
          monthData.exchanges++;
          monthData.revenue += Number(item.price) || 0;
        }
        if (item.action === 'refund') {
          monthData.refunds++;
        }
      }
    });

    return months.map(({ month, returns, exchanges, refunds, revenue }) => ({
      month, returns, exchanges, refunds, revenue
    }));
  }

  private static calculateTopReturnReasons(returnsData: any[]) {
    const reasonCounts = new Map<string, number>();
    
    returnsData.forEach(ret => {
      const reason = ret.reason || 'Not specified';
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    });

    const total = returnsData.length;
    return Array.from(reasonCounts.entries())
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  static async subscribeToUpdates(merchantId: string, callback: (analytics: RealTimeAnalytics) => void) {
    const channel = supabase
      .channel(`enhanced-analytics-${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `merchant_id=eq.${merchantId}`
        },
        () => {
          MonitoringService.info('Real-time analytics update triggered', { merchantId });
          this.handleDataUpdate(merchantId, callback);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_items',
        },
        () => this.handleDataUpdate(merchantId, callback)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions',
        },
        () => this.handleDataUpdate(merchantId, callback)
      )
      .subscribe();

    return channel;
  }

  private static async handleDataUpdate(merchantId: string, callback: (analytics: RealTimeAnalytics) => void) {
    try {
      // Invalidate cache to force fresh data
      PerformanceOptimizer.invalidateCache(`analytics_${merchantId}`);
      
      const analytics = await this.getAnalytics(merchantId);
      callback(analytics);
    } catch (error) {
      MonitoringService.error('Real-time analytics update failed', { merchantId, error });
    }
  }
}
