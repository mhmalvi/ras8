
import { supabase } from '@/integrations/supabase/client';

export interface RealTimeAnalytics {
  totalReturns: number;
  totalExchanges: number;
  aiAcceptanceRate: number;
  revenueImpact: number;
  returnsByStatus: {
    requested: number;
    approved: number;
    in_transit: number;
    completed: number;
    rejected: number;
  };
  monthlyTrends: Array<{
    month: string;
    returns: number;
    exchanges: number;
    revenue: number;
  }>;
}

export class RealTimeAnalyticsService {
  static async getAnalytics(merchantId: string): Promise<RealTimeAnalytics> {
    console.log('📊 Fetching real-time analytics for merchant:', merchantId);

    try {
      // Fetch returns data with return items
      const { data: returns, error: returnsError } = await supabase
        .from('returns')
        .select(`
          *,
          return_items (*)
        `)
        .eq('merchant_id', merchantId);

      if (returnsError) throw returnsError;

      // Fetch AI suggestions data
      const { data: aiSuggestions, error: aiError } = await supabase
        .from('ai_suggestions')
        .select('*')
        .in('return_id', returns?.map(r => r.id) || []);

      if (aiError) throw aiError;

      // Calculate analytics
      const totalReturns = returns?.length || 0;
      const totalExchanges = returns?.filter(r => 
        r.return_items?.some((item: any) => item.action === 'exchange')
      ).length || 0;

      // Calculate AI acceptance rate
      const acceptedAI = aiSuggestions?.filter(ai => ai.accepted === true).length || 0;
      const totalAI = aiSuggestions?.length || 0;
      const aiAcceptanceRate = totalAI > 0 ? Math.round((acceptedAI / totalAI) * 100) : 0;

      // Calculate revenue impact (from completed exchanges)
      const revenueImpact = returns?.reduce((sum, returnItem) => {
        if (returnItem.status === 'completed' && 
            returnItem.return_items?.some((item: any) => item.action === 'exchange')) {
          return sum + (Number(returnItem.total_amount) || 0);
        }
        return sum;
      }, 0) || 0;

      // Calculate returns by status
      const returnsByStatus = {
        requested: returns?.filter(r => r.status === 'requested').length || 0,
        approved: returns?.filter(r => r.status === 'approved').length || 0,
        in_transit: returns?.filter(r => r.status === 'in_transit').length || 0,
        completed: returns?.filter(r => r.status === 'completed').length || 0,
        rejected: returns?.filter(r => r.status === 'rejected').length || 0,
      };

      // Calculate monthly trends (last 6 months)
      const monthlyTrends = this.calculateMonthlyTrends(returns || []);

      const analytics: RealTimeAnalytics = {
        totalReturns,
        totalExchanges,
        aiAcceptanceRate,
        revenueImpact,
        returnsByStatus,
        monthlyTrends
      };

      console.log('✅ Analytics calculated:', analytics);
      return analytics;

    } catch (error) {
      console.error('💥 Error fetching analytics:', error);
      throw error;
    }
  }

  static calculateMonthlyTrends(returns: any[]): Array<{
    month: string;
    returns: number;
    exchanges: number;
    revenue: number;
  }> {
    const now = new Date();
    const trends = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthReturns = returns.filter(r => {
        const returnDate = new Date(r.created_at);
        return returnDate >= monthStart && returnDate <= monthEnd;
      });

      const exchanges = monthReturns.filter(r => 
        r.return_items?.some((item: any) => item.action === 'exchange')
      ).length;

      const revenue = monthReturns.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0);

      trends.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        returns: monthReturns.length,
        exchanges,
        revenue
      });
    }

    return trends;
  }

  static async subscribeToUpdates(
    merchantId: string, 
    callback: (analytics: RealTimeAnalytics) => void
  ) {
    console.log('📡 Setting up real-time analytics subscription for merchant:', merchantId);

    const channel = supabase
      .channel(`analytics-${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns',
          filter: `merchant_id=eq.${merchantId}`
        },
        async () => {
          console.log('🔄 Returns data changed, refreshing analytics...');
          try {
            const updatedAnalytics = await this.getAnalytics(merchantId);
            callback(updatedAnalytics);
          } catch (error) {
            console.error('💥 Error refreshing analytics:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_suggestions'
        },
        async () => {
          console.log('🔄 AI suggestions changed, refreshing analytics...');
          try {
            const updatedAnalytics = await this.getAnalytics(merchantId);
            callback(updatedAnalytics);
          } catch (error) {
            console.error('💥 Error refreshing analytics:', error);
          }
        }
      )
      .subscribe();

    return channel;
  }
}
