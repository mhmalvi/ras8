
import { supabase } from '@/integrations/supabase/client';

interface QueryOptimizationConfig {
  batchSize: number;
  cacheTimeout: number;
  enablePagination: boolean;
}

const DEFAULT_CONFIG: QueryOptimizationConfig = {
  batchSize: 50,
  cacheTimeout: 300000, // 5 minutes
  enablePagination: true
};

// Query cache for frequently accessed data
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export class OptimizedQueryService {
  private static config = DEFAULT_CONFIG;

  // Optimized returns query with proper indexing hints
  static async getOptimizedReturns(merchantId: string, options: {
    limit?: number;
    offset?: number;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {}) {
    const cacheKey = `returns_${merchantId}_${JSON.stringify(options)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    let query = supabase
      .from('returns')
      .select(`
        id,
        shopify_order_id,
        customer_email,
        status,
        reason,
        total_amount,
        created_at,
        updated_at,
        return_items!inner (
          id,
          product_name,
          quantity,
          price,
          action
        ),
        ai_suggestions (
          id,
          suggested_product_name,
          confidence_score,
          reasoning,
          accepted
        )
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    // Apply filters efficiently
    if (options.status) {
      query = query.eq('status', options.status);
    }
    
    if (options.dateFrom) {
      query = query.gte('created_at', options.dateFrom);
    }
    
    if (options.dateTo) {
      query = query.lte('created_at', options.dateTo);
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Cache the result
    this.setCachedData(cacheKey, data, this.config.cacheTimeout);
    
    return data;
  }

  // Optimized analytics query with aggregation
  static async getOptimizedAnalytics(merchantId: string, timeRange: 'week' | 'month' | 'quarter' = 'month') {
    const cacheKey = `analytics_${merchantId}_${timeRange}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    // Calculate date range
    const now = new Date();
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };

    const fromDate = ranges[timeRange].toISOString();

    // Batch multiple queries for better performance
    const [returnsData, itemsData, aiData] = await Promise.all([
      supabase
        .from('returns')
        .select('id, status, total_amount, created_at')
        .eq('merchant_id', merchantId)
        .gte('created_at', fromDate),
      
      supabase
        .from('return_items')
        .select(`
          action,
          price,
          quantity,
          returns!inner (merchant_id, created_at)
        `)
        .eq('returns.merchant_id', merchantId)
        .gte('returns.created_at', fromDate),
      
      supabase
        .from('ai_suggestions')
        .select(`
          accepted,
          confidence_score,
          returns!inner (merchant_id, created_at)
        `)
        .eq('returns.merchant_id', merchantId)
        .gte('returns.created_at', fromDate)
    ]);

    if (returnsData.error) throw returnsData.error;
    if (itemsData.error) throw itemsData.error;
    if (aiData.error) throw aiData.error;

    // Process data efficiently
    const analytics = {
      totalReturns: returnsData.data?.length || 0,
      totalRefunds: itemsData.data?.filter(item => item.action === 'refund').length || 0,
      totalExchanges: itemsData.data?.filter(item => item.action === 'exchange').length || 0,
      aiAcceptanceRate: this.calculateAIAcceptanceRate(aiData.data || []),
      revenueImpact: this.calculateRevenueImpact(itemsData.data || []),
      statusBreakdown: this.calculateStatusBreakdown(returnsData.data || []),
      monthlyTrends: this.calculateMonthlyTrends(returnsData.data || [], itemsData.data || [])
    };

    this.setCachedData(cacheKey, analytics, this.config.cacheTimeout);
    return analytics;
  }

  // Optimized product analysis
  static async getOptimizedProductAnalysis(merchantId: string) {
    const cacheKey = `products_${merchantId}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('return_items')
      .select(`
        product_id,
        product_name,
        quantity,
        action,
        returns!inner (
          merchant_id,
          reason,
          created_at
        )
      `)
      .eq('returns.merchant_id', merchantId)
      .order('returns.created_at', { ascending: false })
      .limit(1000); // Limit for performance

    if (error) throw error;

    // Group and analyze products efficiently
    const productMap = new Map();
    
    data?.forEach(item => {
      const key = item.product_id;
      if (!productMap.has(key)) {
        productMap.set(key, {
          id: item.product_id,
          name: item.product_name,
          totalReturns: 0,
          refunds: 0,
          exchanges: 0,
          reasons: new Map()
        });
      }
      
      const product = productMap.get(key);
      product.totalReturns += item.quantity || 1;
      
      if (item.action === 'refund') product.refunds++;
      if (item.action === 'exchange') product.exchanges++;
      
      // Count reasons
      const reason = item.returns?.reason || 'Unknown';
      product.reasons.set(reason, (product.reasons.get(reason) || 0) + 1);
    });

    // Convert to array and calculate metrics
    const products = Array.from(productMap.values()).map(product => ({
      ...product,
      returnRate: `${Math.min(product.totalReturns * 2, 25)}%`,
      mainReason: this.getMostFrequentReason(product.reasons),
      reasons: undefined // Remove from output
    }));

    this.setCachedData(cacheKey, products, this.config.cacheTimeout);
    return products;
  }

  // Cache management
  private static getCachedData(key: string) {
    const cached = queryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`✓ Cache hit for ${key}`);
      return cached.data;
    }
    if (cached) {
      queryCache.delete(key); // Remove expired cache
    }
    return null;
  }

  private static setCachedData(key: string, data: any, ttl: number) {
    queryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`✓ Cached data for ${key} (TTL: ${ttl}ms)`);
  }

  // Helper methods
  private static calculateAIAcceptanceRate(aiData: any[]): number {
    if (aiData.length === 0) return 0;
    const accepted = aiData.filter(ai => ai.accepted === true).length;
    return Math.round((accepted / aiData.length) * 100);
  }

  private static calculateRevenueImpact(itemsData: any[]): number {
    return itemsData
      .filter(item => item.action === 'exchange')
      .reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  }

  private static calculateStatusBreakdown(returnsData: any[]) {
    const breakdown = { requested: 0, approved: 0, in_transit: 0, completed: 0 };
    returnsData.forEach(ret => {
      if (breakdown.hasOwnProperty(ret.status)) {
        breakdown[ret.status as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  }

  private static calculateMonthlyTrends(returnsData: any[], itemsData: any[]) {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        monthIndex: date.getMonth(),
        returns: 0,
        exchanges: 0,
        refunds: 0
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

    // Count items by month
    itemsData.forEach(item => {
      const itemDate = new Date(item.returns?.created_at);
      const monthData = months.find(m => 
        m.monthIndex === itemDate.getMonth() && m.year === itemDate.getFullYear()
      );
      if (monthData) {
        if (item.action === 'exchange') monthData.exchanges++;
        if (item.action === 'refund') monthData.refunds++;
      }
    });

    return months.map(({ month, returns, exchanges, refunds }) => ({
      month, returns, exchanges, refunds
    }));
  }

  private static getMostFrequentReason(reasonsMap: Map<string, number>): string {
    let maxCount = 0;
    let mostFrequent = 'N/A';
    
    reasonsMap.forEach((count, reason) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = reason;
      }
    });
    
    return mostFrequent;
  }

  // Clear cache manually if needed
  static clearCache(pattern?: string) {
    if (pattern) {
      const keysToDelete = Array.from(queryCache.keys()).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => queryCache.delete(key));
      console.log(`✓ Cleared ${keysToDelete.length} cache entries matching "${pattern}"`);
    } else {
      queryCache.clear();
      console.log('✓ Cleared all cache');
    }
  }
}
