
import { supabase } from '@/integrations/supabase/client';

// Cache management
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export class PerformanceOptimizer {
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly CACHE_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
  private static cleanupTimer: NodeJS.Timeout | null = null;

  // Initialize cleanup timer only when needed
  private static ensureCleanupTimer() {
    if (!this.cleanupTimer) {
      this.cleanupTimer = setInterval(() => {
        this.cleanupExpiredCache();
      }, this.CACHE_CLEANUP_INTERVAL);
    }
  }

  // Stop cleanup timer to prevent memory leaks
  static stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  static getCachedData(key: string): any | null {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`🎯 Cache hit: ${key}`);
      return cached.data;
    }
    if (cached) {
      cache.delete(key); // Remove expired
    }
    return null;
  }

  static setCachedData(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    // Ensure cleanup timer is running
    this.ensureCleanupTimer();
    
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`);
  }

  private static cleanupExpiredCache(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, cached] of cache.entries()) {
      if (now - cached.timestamp >= cached.ttl) {
        cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  // Optimized database queries with caching
  static async getOptimizedReturns(
    merchantId: string, 
    filters: { status?: string; limit?: number; offset?: number } = {}
  ) {
    const cacheKey = `returns_${merchantId}_${JSON.stringify(filters)}`;
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      let query = supabase
        .from('returns')
        .select(`
          *,
          return_items (
            id,
            product_id,
            product_name,
            quantity,
            price,
            action
          )
        `)
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      // Cache the results
      this.setCachedData(cacheKey, data, 2 * 60 * 1000); // 2 minutes for returns data
      
      return data;
    } catch (error) {
      console.error('Optimized returns query failed:', error);
      throw error;
    }
  }

  static async getOptimizedAnalytics(merchantId: string) {
    const cacheKey = `analytics_${merchantId}`;
    
    // Check cache first
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) return cachedData;

    try {
      // Parallel queries for better performance
      const [returnsData, returnItemsData, aiSuggestionsData] = await Promise.all([
        supabase
          .from('returns')
          .select('id, status, total_amount, created_at, reason')
          .eq('merchant_id', merchantId),
        
        supabase
          .from('return_items')
          .select(`
            action,
            price,
            returns!inner (merchant_id, created_at)
          `)
          .eq('returns.merchant_id', merchantId),
        
        supabase
          .from('ai_suggestions')
          .select(`
            accepted,
            confidence_score,
            returns!inner (merchant_id, created_at)
          `)
          .eq('returns.merchant_id', merchantId)
      ]);

      const analytics = {
        returns: returnsData.data || [],
        returnItems: returnItemsData.data || [],
        aiSuggestions: aiSuggestionsData.data || []
      };

      // Cache for 5 minutes
      this.setCachedData(cacheKey, analytics, 5 * 60 * 1000);
      
      return analytics;
    } catch (error) {
      console.error('Optimized analytics query failed:', error);
      throw error;
    }
  }

  // Batch operations for better performance
  static async batchUpdateReturns(updates: Array<{ id: string; status: string; merchant_id: string }>) {
    try {
      console.log(`🔄 Batch updating ${updates.length} returns`);
      
      const results = await Promise.allSettled(
        updates.map(update => 
          supabase
            .from('returns')
            .update({ status: update.status, updated_at: new Date().toISOString() })
            .eq('id', update.id)
            .eq('merchant_id', update.merchant_id)
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.length - successful;

      if (failed > 0) {
        console.warn(`⚠️ Batch update: ${successful} successful, ${failed} failed`);
      } else {
        console.log(`✅ Batch update: all ${successful} updates successful`);
      }

      // Invalidate related caches
      updates.forEach(update => {
        this.invalidateCache(`returns_${update.merchant_id}`);
        this.invalidateCache(`analytics_${update.merchant_id}`);
      });

      return { successful, failed };
    } catch (error) {
      console.error('Batch update failed:', error);
      throw error;
    }
  }

  static invalidateCache(pattern: string): void {
    let invalidated = 0;
    // More efficient cache invalidation using startsWith for merchant-specific patterns
    for (const key of cache.keys()) {
      if (key.startsWith(pattern) || key.includes(pattern)) {
        cache.delete(key);
        invalidated++;
      }
    }
    if (invalidated > 0) {
      console.log(`🗑️ Invalidated ${invalidated} cache entries matching: ${pattern}`);
    }
  }

  // Clear all cache entries (for cleanup)
  static clearAllCache(): void {
    const size = cache.size;
    cache.clear();
    this.stopCleanupTimer();
    console.log(`🧹 Cleared ${size} cache entries and stopped cleanup timer`);
  }

  // Database connection pooling and optimization
  static async optimizeConnection(): Promise<void> {
    try {
      // Test connection and measure performance
      const start = Date.now();
      const { error } = await supabase.from('merchants').select('id').limit(1);
      const duration = Date.now() - start;
      
      if (error) {
        console.error('Database connection test failed:', error);
      } else {
        console.log(`✅ Database connection test: ${duration}ms`);
        
        if (duration > 1000) {
          console.warn('⚠️ Slow database connection detected');
        }
      }
    } catch (error) {
      console.error('Connection optimization failed:', error);
    }
  }

  // Memory usage monitoring
  static getPerformanceMetrics() {
    return {
      cacheSize: cache.size,
      cacheEntries: Array.from(cache.keys()),
      memoryUsage: (performance as any)?.memory || 'Not available'
    };
  }
}

// Auto-optimize on module load
PerformanceOptimizer.optimizeConnection();
