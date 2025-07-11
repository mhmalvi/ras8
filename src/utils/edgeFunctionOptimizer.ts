
import { supabase } from '@/integrations/supabase/client';

interface EdgeFunctionMetrics {
  functionName: string;
  averageResponseTime: number;
  coldStarts: number;
  totalInvocations: number;
  errorRate: number;
}

interface OptimizationConfig {
  maxRetries: number;
  retryDelay: number;
  timeout: number;
  cacheEnabled: boolean;
  cacheDuration: number;
}

const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000,
  cacheEnabled: true,
  cacheDuration: 300000 // 5 minutes
};

// Response cache for edge functions
const edgeFunctionCache = new Map<string, {
  response: any;
  timestamp: number;
  ttl: number;
}>();

export class EdgeFunctionOptimizer {
  private static config = DEFAULT_OPTIMIZATION_CONFIG;
  private static metrics = new Map<string, EdgeFunctionMetrics>();

  /**
   * Optimized edge function invoker with retry logic, caching, and performance monitoring
   */
  static async invokeOptimized<T = any>(
    functionName: string,
    payload: object = {},
    options: Partial<OptimizationConfig> = {}
  ): Promise<{ data?: T; error?: string; success: boolean; metrics: { responseTime: number; cached: boolean } }> {
    const startTime = Date.now();
    const config = { ...this.config, ...options };
    const cacheKey = `${functionName}_${JSON.stringify(payload)}`;

    // Check cache first
    if (config.cacheEnabled) {
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        console.log(`🚀 Cache hit for edge function: ${functionName}`);
        return {
          data: cached,
          success: true,
          metrics: {
            responseTime: Date.now() - startTime,
            cached: true
          }
        };
      }
    }

    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt < config.maxRetries) {
      try {
        console.log(`🚀 Invoking edge function: ${functionName} (attempt ${attempt + 1})`);
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error(`Timeout after ${config.timeout}ms`)), config.timeout);
        });

        // Invoke function with timeout
        const functionPromise = supabase.functions.invoke(functionName, { 
          body: payload 
        });

        const result = await Promise.race([functionPromise, timeoutPromise]) as any;

        if (result.error) {
          throw new Error(result.error.message || `Edge function ${functionName} failed`);
        }

        const responseTime = Date.now() - startTime;
        
        // Update metrics
        this.updateMetrics(functionName, responseTime, false);

        // Cache successful response
        if (config.cacheEnabled && result.data) {
          this.setCachedResponse(cacheKey, result.data, config.cacheDuration);
        }

        console.log(`✅ Edge function success: ${functionName} (${responseTime}ms)`);
        
        return {
          data: result.data,
          success: true,
          metrics: {
            responseTime,
            cached: false
          }
        };

      } catch (error) {
        lastError = error as Error;
        attempt++;
        
        console.warn(`⚠️ Edge function attempt ${attempt} failed for ${functionName}:`, error);
        
        // Update error metrics
        this.updateMetrics(functionName, Date.now() - startTime, true);

        if (attempt < config.maxRetries) {
          // Exponential backoff
          const delay = config.retryDelay * Math.pow(2, attempt - 1);
          console.log(`⏳ Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    const responseTime = Date.now() - startTime;
    console.error(`💥 Edge function failed after ${config.maxRetries} attempts: ${functionName}`);
    
    return {
      error: lastError?.message || `Edge function ${functionName} failed after ${config.maxRetries} attempts`,
      success: false,
      metrics: {
        responseTime,
        cached: false
      }
    };
  }

  /**
   * Batch invoke multiple edge functions with optimization
   */
  static async invokeBatch<T = any>(
    requests: Array<{ functionName: string; payload: object; options?: Partial<OptimizationConfig> }>
  ): Promise<Array<{ data?: T; error?: string; success: boolean; metrics: { responseTime: number; cached: boolean } }>> {
    console.log(`🚀 Batch invoking ${requests.length} edge functions`);
    
    const promises = requests.map(({ functionName, payload, options }) =>
      this.invokeOptimized<T>(functionName, payload, options)
    );
    
    return Promise.all(promises);
  }

  /**
   * Preload/warm up edge functions to reduce cold starts
   */
  static async warmupFunctions(functionNames: string[]): Promise<void> {
    console.log(`🔥 Warming up ${functionNames.length} edge functions`);
    
    const warmupPromises = functionNames.map(async (functionName) => {
      try {
        await this.invokeOptimized(functionName, { warmup: true }, { 
          maxRetries: 1, 
          cacheEnabled: false,
          timeout: 10000
        });
        console.log(`✅ Warmed up: ${functionName}`);
      } catch (error) {
        console.warn(`⚠️ Failed to warm up: ${functionName}`);
      }
    });

    await Promise.allSettled(warmupPromises);
    console.log(`🔥 Edge function warmup complete`);
  }

  // Cache management
  private static getCachedResponse(key: string) {
    const cached = edgeFunctionCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.response;
    }
    if (cached) {
      edgeFunctionCache.delete(key); // Remove expired cache
    }
    return null;
  }

  private static setCachedResponse(key: string, response: any, ttl: number) {
    edgeFunctionCache.set(key, {
      response,
      timestamp: Date.now(),
      ttl
    });
  }

  // Metrics tracking
  private static updateMetrics(functionName: string, responseTime: number, isError: boolean) {
    const current = this.metrics.get(functionName) || {
      functionName,
      averageResponseTime: 0,
      coldStarts: 0,
      totalInvocations: 0,
      errorRate: 0
    };

    current.totalInvocations++;
    current.averageResponseTime = (current.averageResponseTime * (current.totalInvocations - 1) + responseTime) / current.totalInvocations;
    
    if (isError) {
      current.errorRate = (current.errorRate * (current.totalInvocations - 1) + 1) / current.totalInvocations;
    } else {
      current.errorRate = (current.errorRate * (current.totalInvocations - 1)) / current.totalInvocations;
    }

    // Detect cold starts (response time > 3 seconds)
    if (responseTime > 3000) {
      current.coldStarts++;
    }

    this.metrics.set(functionName, current);
  }

  /**
   * Get performance metrics for all edge functions
   */
  static getMetrics(): EdgeFunctionMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear all caches and reset metrics
   */
  static reset() {
    edgeFunctionCache.clear();
    this.metrics.clear();
    console.log('🧹 Edge function optimizer reset');
  }

  /**
   * Configure optimization settings
   */
  static configure(config: Partial<OptimizationConfig>) {
    this.config = { ...this.config, ...config };
    console.log('⚙️ Edge function optimizer configured:', this.config);
  }
}

// Auto-warmup on application start
if (typeof window !== 'undefined') {
  // Only run in browser
  setTimeout(() => {
    EdgeFunctionOptimizer.warmupFunctions([
      'generate-exchange-recommendation',
      'generate-analytics-insights',
      'check-subscription'
    ]);
  }, 2000);
}
