import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      totalMemory: JSON.stringify(Array.from(this.cache.entries())).length
    };
  }
}

export const cacheManager = new CacheManager();

export class OptimizedQueryService {
  static async getDashboardMetrics(merchantId: string) {
    const cacheKey = `dashboard-metrics-${merchantId}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit for dashboard metrics');
      return cached;
    }

    try {
      console.log('🔍 Fetching fresh dashboard metrics');
      
      const { data, error } = await supabase.rpc('get_dashboard_metrics_optimized', {
        p_merchant_id: merchantId
      });

      if (error) throw error;

      const metrics = data || {
        totalReturns: 0,
        pendingReturns: 0,
        completedReturns: 0,
        totalRevenue: 0,
        averageProcessingTime: 0,
        aiAcceptanceRate: 0,
        topReturnReasons: [],
        monthlyTrends: []
      };

      cacheManager.set(cacheKey, metrics, 5 * 60 * 1000);
      return metrics;

    } catch (error) {
      console.error('Dashboard metrics query failed:', error);
      throw error;
    }
  }

  static async getAnalyticsData(
    merchantId: string,
    eventType?: string,
    dateRange?: { start: string; end: string }
  ) {
    const cacheKey = `analytics-${merchantId}-${eventType}-${JSON.stringify(dateRange)}`;
    const cached = cacheManager.get(cacheKey);
    if (cached) {
      console.log('📦 Cache hit for analytics data');
      return cached;
    }

    try {
      const { data, error } = await supabase.rpc('get_analytics_aggregated', {
        p_merchant_id: merchantId,
        p_event_type: eventType,
        p_start_date: dateRange?.start,
        p_end_date: dateRange?.end
      });

      if (error) throw error;

      const analytics = data || {
        totalEvents: 0,
        eventsByType: {},
        timeSeriesData: [],
        summary: {}
      };

      cacheManager.set(cacheKey, analytics, 10 * 60 * 1000);
      return analytics;

    } catch (error) {
      console.error('Analytics aggregation failed:', error);
      throw error;
    }
  }

  static invalidateCache(pattern: string) {
    console.log(`🗑️ Invalidating cache pattern: ${pattern}`);
    cacheManager.invalidate(pattern);
  }

  static getCacheStats() {
    return cacheManager.getStats();
  }
}