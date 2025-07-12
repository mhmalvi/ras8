
import { supabase } from '@/integrations/supabase/client';

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
    console.log('🔄 Fetching real-time analytics for merchant:', merchantId);

    try {
      // Fetch all data in parallel for better performance
      const [returnsData, returnItemsData, aiSuggestionsData] = await Promise.all([
        this.getReturnsData(merchantId),
        this.getReturnItemsData(merchantId),
        this.getAISuggestionsData(merchantId)
      ]);

      // Calculate analytics from real data
      const analytics = this.calculateAnalytics(returnsData, returnItemsData, aiSuggestionsData);
      
      console.log('✅ Analytics calculated from real data:', analytics);
      return analytics;

    } catch (error) {
      console.error('💥 Error fetching real-time analytics:', error);
      throw error;
    }
  }

  private static async getReturnsData(merchantId: string) {
    const { data, error } = await supabase
      .from('returns')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private static async getReturnItemsData(merchantId: string) {
    const { data, error } = await supabase
      .from('return_items')
      .select(`
        *,
        returns!inner (
          merchant_id,
          created_at,
          status
        )
      `)
      .eq('returns.merchant_id', merchantId);

    if (error) throw error;
    return data || [];
  }

  private static async getAISuggestionsData(merchantId: string) {
    const { data, error } = await supabase
      .from('ai_suggestions')
      .select(`
        *,
        returns!inner (
          merchant_id,
          created_at
        )
      `)
      .eq('returns.merchant_id', merchantId);

    if (error) throw error;
    return data || [];
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
    const aiAcceptanceRate = totalSuggestions > 0 ? (acceptedSuggestions / totalSuggestions) * 100 : 0;

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
      aiAcceptanceRate: Math.round(aiAcceptanceRate),
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
      .channel(`real-time-analytics-${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `merchant_id=eq.${merchantId}`
        },
        () => this.handleDataUpdate(merchantId, callback)
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
      const analytics = await this.getAnalytics(merchantId);
      callback(analytics);
    } catch (error) {
      console.error('Error updating analytics:', error);
    }
  }
}
