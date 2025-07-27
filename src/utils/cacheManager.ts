interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
  enableMetrics: boolean;
}

interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalRequests: number;
  hitRate: number;
  averageResponseTime: number;
}

class CacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0,
    hitRate: 0,
    averageResponseTime: 0
  };
  private cleanupTimer?: number;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 1000,
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      enableMetrics: true,
      ...config
    };

    if (this.config.enableMetrics) {
      this.startCleanupTimer();
    }
  }

  private startCleanupTimer() {
    this.cleanupTimer = window.setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  set(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp,
      ttl: ttl || this.config.defaultTTL,
      hits: 0,
      lastAccessed: timestamp
    };

    // Check if we need to evict entries
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
  }

  get(key: string): T | null {
    this.metrics.totalRequests++;
    
    const entry = this.cache.get(key);
    if (!entry) {
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      this.updateHitRate();
      return null;
    }

    entry.hits++;
    entry.lastAccessed = now;
    this.metrics.hits++;
    this.updateHitRate();
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.resetMetrics();
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.metrics.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }

    toDelete.forEach(key => this.cache.delete(key));
  }

  private updateHitRate(): void {
    if (this.metrics.totalRequests > 0) {
      this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
    }
  }

  private resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0,
      hitRate: 0,
      averageResponseTime: 0
    };
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Async wrapper for expensive operations with caching
  async getOrSet<K = T>(
    key: string,
    fetcher: () => Promise<K>,
    ttl?: number
  ): Promise<K> {
    const startTime = Date.now();
    
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached as unknown as K;
    }

    try {
      // Fetch the data
      const data = await fetcher();
      
      // Cache the result
      this.set(key, data as unknown as T, ttl);
      
      // Update average response time
      const responseTime = Date.now() - startTime;
      this.updateAverageResponseTime(responseTime);
      
      return data;
    } catch (error) {
      console.error(`Error fetching data for key ${key}:`, error);
      throw error;
    }
  }

  private updateAverageResponseTime(responseTime: number): void {
    if (this.metrics.averageResponseTime === 0) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      // Simple moving average
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime + responseTime) / 2;
    }
  }

  // Batch operations
  setMany(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  getMany(keys: string[]): Record<string, T | null> {
    const result: Record<string, T | null> = {};
    keys.forEach(key => {
      result[key] = this.get(key);
    });
    return result;
  }

  deleteMany(keys: string[]): void {
    keys.forEach(key => this.delete(key));
  }

  // Pattern-based operations
  deleteByPattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getByPattern(pattern: RegExp): Record<string, T> {
    const result: Record<string, T> = {};
    
    for (const [key, entry] of this.cache.entries()) {
      if (pattern.test(key)) {
        const data = this.get(key);
        if (data !== null) {
          result[key] = data;
        }
      }
    }

    return result;
  }

  // Export/Import cache state
  export(): string {
    const exportData = {
      cache: Array.from(this.cache.entries()),
      metrics: this.metrics,
      timestamp: Date.now()
    };
    return JSON.stringify(exportData);
  }

  import(data: string): void {
    try {
      const importData = JSON.parse(data);
      this.cache.clear();
      
      importData.cache.forEach(([key, entry]: [string, CacheEntry<T>]) => {
        this.cache.set(key, entry);
      });
      
      this.metrics = importData.metrics || this.metrics;
    } catch (error) {
      console.error('Failed to import cache data:', error);
    }
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.clear();
  }
}

// Create specialized cache instances
export const apiCache = new CacheManager({
  maxSize: 500,
  defaultTTL: 5 * 60 * 1000, // 5 minutes
  enableMetrics: true
});

export const userDataCache = new CacheManager({
  maxSize: 100,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  enableMetrics: true
});

export const analyticsCache = new CacheManager({
  maxSize: 200,
  defaultTTL: 15 * 60 * 1000, // 15 minutes
  enableMetrics: true
});

export const aiCache = new CacheManager({
  maxSize: 300,
  defaultTTL: 30 * 60 * 1000, // 30 minutes for AI responses
  enableMetrics: true
});

// Global cache manager with development debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).cacheDebug = {
    api: apiCache,
    userData: userDataCache,
    analytics: analyticsCache,
    ai: aiCache,
    getAllMetrics: () => ({
      api: apiCache.getMetrics(),
      userData: userDataCache.getMetrics(),
      analytics: analyticsCache.getMetrics(),
      ai: aiCache.getMetrics()
    })
  };
}

export { CacheManager };