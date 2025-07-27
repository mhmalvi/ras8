/**
 * Enhanced Rate Limiting Service
 * Implements per-merchant and per-endpoint rate limiting
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private config: RateLimitConfig) {
    // Auto-cleanup expired entries every 5 minutes
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   */
  check(req: Request, identifier?: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  } {
    const key = identifier || this.generateKey(req);
    const now = Date.now();
    
    const entry = this.store.get(key);
    
    // Create new entry if none exists or window expired
    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        firstRequest: now
      };
      
      this.store.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: newEntry.resetTime,
        totalHits: 1
      };
    }
    
    // Check if limit exceeded
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        totalHits: entry.count
      };
    }
    
    // Increment counter
    entry.count++;
    this.store.set(key, entry);
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
      totalHits: entry.count
    };
  }

  /**
   * Generate rate limit key from request
   */
  protected generateKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }
    
    // Try to get user ID from JWT
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        return `user:${payload.sub}`;
      } catch {
        // Fall through to IP-based
      }
    }
    
    // Fallback to IP address
    const ip = this.getClientIP(req);
    return `ip:${ip}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    
    const realIP = req.headers.get('x-real-ip');
    if (realIP) return realIP;
    
    const cfIP = req.headers.get('cf-connecting-ip');
    if (cfIP) return cfIP;
    
    return 'unknown';
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Rate limiter cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current stats for a key
   */
  getStats(key: string): RateLimitEntry | null {
    return this.store.get(key) || null;
  }

  /**
   * Destroy the rate limiter and cleanup
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }
}

/**
 * Merchant-specific rate limiter
 */
export class MerchantRateLimiter extends RateLimiter {
  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    super({
      windowMs,
      maxRequests,
      keyGenerator: (req: Request) => {
        // Try to extract merchant ID from request
        const url = new URL(req.url);
        const merchantId = url.searchParams.get('merchant_id') || 
                          req.headers.get('x-merchant-id');
        
        if (merchantId) {
          return `merchant:${merchantId}`;
        }
        
        // Fallback to user-based limiting
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          try {
            const token = authHeader.slice(7);
            const payload = JSON.parse(atob(token.split('.')[1]));
            return `user:${payload.sub}`;
          } catch {
            // Fall through
          }
        }
        
        return `ip:${this.getIPAddress(req)}`;
      }
    });
  }
  
  private getIPAddress(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    
    const realIP = req.headers.get('x-real-ip');
    if (realIP) return realIP;
    
    const cfIP = req.headers.get('cf-connecting-ip');
    if (cfIP) return cfIP;
    
    return 'unknown';
  }
}

/**
 * API endpoint-specific rate limiters
 */
export const RateLimitPresets = {
  // Authentication endpoints (stricter)
  AUTH: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 attempts per 15 minutes
  }),
  
  // API endpoints (moderate)
  API: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  }),
  
  // AI recommendations (expensive operations)
  AI: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10 // 10 AI requests per minute
  }),
  
  // Webhook endpoints (high volume)
  WEBHOOK: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000 // 1000 webhooks per minute
  }),
  
  // Customer portal (public facing)
  CUSTOMER: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 50 // 50 requests per minute
  })
};

/**
 * Rate limit middleware for edge functions
 */
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (req: Request): Promise<Response | null> => {
    const result = limiter.check(req);
    
    if (!result.allowed) {
      console.warn(`🚫 Rate limit exceeded for request`);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${Math.ceil((result.resetTime - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': limiter['config'].maxRequests.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
          }
        }
      );
    }
    
    // Add rate limit headers to successful responses
    return null; // Continue processing
  };
}

/**
 * Merchant-specific rate limiting
 */
export function createMerchantRateLimit(maxRequestsPerMinute: number = 100) {
  const limiter = new MerchantRateLimiter(60 * 1000, maxRequestsPerMinute);
  return createRateLimitMiddleware(limiter as RateLimiter);
}