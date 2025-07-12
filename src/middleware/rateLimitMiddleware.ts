import { supabase } from '@/integrations/supabase/client';

interface RateLimitRule {
  endpoint: string;
  limit: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitAttempt {
  timestamp: number;
  success: boolean;
  ip: string;
  userId?: string;
}

class RateLimitManager {
  private attempts: Map<string, RateLimitAttempt[]> = new Map();
  private rules: RateLimitRule[] = [
    { endpoint: '/api/auth/login', limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
    { endpoint: '/api/returns', limit: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
    { endpoint: '/api/ai/recommendations', limit: 50, windowMs: 60 * 60 * 1000 }, // 50 AI requests per hour
    { endpoint: '/api/webhooks/shopify', limit: 1000, windowMs: 60 * 60 * 1000 }, // 1000 webhooks per hour
    { endpoint: 'default', limit: 1000, windowMs: 60 * 60 * 1000 } // Default rate limit
  ];

  private getClientIdentifier(request: Request): string {
    // Try to get user ID from JWT, otherwise use IP
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return `user:${payload.sub}`;
      } catch {
        // Fall back to IP if JWT parsing fails
      }
    }
    
    return `ip:${this.getClientIP(request)}`;
  }

  private getClientIP(request: Request): string {
    // Check various headers for the real IP
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;
    
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) return cfConnectingIP;
    
    return 'unknown';
  }

  private getRuleForEndpoint(endpoint: string): RateLimitRule {
    return this.rules.find(rule => endpoint.startsWith(rule.endpoint)) 
           || this.rules.find(rule => rule.endpoint === 'default')!;
  }

  private cleanOldAttempts(attempts: RateLimitAttempt[], windowMs: number): RateLimitAttempt[] {
    const cutoff = Date.now() - windowMs;
    return attempts.filter(attempt => attempt.timestamp > cutoff);
  }

  async checkRateLimit(request: Request, endpoint: string): Promise<{
    allowed: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    error?: string;
  }> {
    const clientId = this.getClientIdentifier(request);
    const rule = this.getRuleForEndpoint(endpoint);
    const key = `${clientId}:${endpoint}`;
    
    // Get and clean old attempts
    const existingAttempts = this.attempts.get(key) || [];
    const validAttempts = this.cleanOldAttempts(existingAttempts, rule.windowMs);
    
    // Filter attempts based on rule configuration
    let countableAttempts = validAttempts;
    if (rule.skipSuccessfulRequests) {
      countableAttempts = countableAttempts.filter(a => !a.success);
    }
    if (rule.skipFailedRequests) {
      countableAttempts = countableAttempts.filter(a => a.success);
    }
    
    const remaining = Math.max(0, rule.limit - countableAttempts.length);
    const allowed = countableAttempts.length < rule.limit;
    const resetTime = Date.now() + rule.windowMs;
    
    if (!allowed) {
      // Log rate limit violation
      await this.logRateLimitViolation(clientId, endpoint, rule);
      
      return {
        allowed: false,
        limit: rule.limit,
        remaining: 0,
        resetTime,
        error: `Rate limit exceeded. Try again in ${Math.ceil(rule.windowMs / 60000)} minutes.`
      };
    }
    
    return {
      allowed: true,
      limit: rule.limit,
      remaining: remaining - 1, // Account for current request
      resetTime
    };
  }

  recordAttempt(request: Request, endpoint: string, success: boolean) {
    const clientId = this.getClientIdentifier(request);
    const key = `${clientId}:${endpoint}`;
    
    const attempt: RateLimitAttempt = {
      timestamp: Date.now(),
      success,
      ip: this.getClientIP(request),
      userId: clientId.startsWith('user:') ? clientId.split(':')[1] : undefined
    };
    
    const existingAttempts = this.attempts.get(key) || [];
    existingAttempts.push(attempt);
    
    // Keep only recent attempts to prevent memory leak
    const rule = this.getRuleForEndpoint(endpoint);
    const cleanAttempts = this.cleanOldAttempts(existingAttempts, rule.windowMs);
    
    this.attempts.set(key, cleanAttempts);
  }

  private async logRateLimitViolation(clientId: string, endpoint: string, rule: RateLimitRule) {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'rate_limit_violation',
        event_data: {
          client_id: clientId,
          endpoint,
          limit: rule.limit,
          window_ms: rule.windowMs,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to log rate limit violation:', error);
    }
  }

  // Middleware function for Express-style APIs
  middleware(endpoint?: string) {
    return async (request: Request, response: any, next: () => void) => {
      const targetEndpoint = endpoint || new URL(request.url).pathname;
      
      const result = await this.checkRateLimit(request, targetEndpoint);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({ 
            error: result.error,
            limit: result.limit,
            resetTime: result.resetTime
          }),
          { 
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        );
      }
      
      // Add rate limit headers to successful responses
      response.headers = {
        ...response.headers,
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      };
      
      // Record this attempt
      this.recordAttempt(request, targetEndpoint, true);
      
      return next();
    };
  }

  // Get current rate limit status for a client
  getStatus(request: Request, endpoint: string) {
    const clientId = this.getClientIdentifier(request);
    const rule = this.getRuleForEndpoint(endpoint);
    const key = `${clientId}:${endpoint}`;
    
    const existingAttempts = this.attempts.get(key) || [];
    const validAttempts = this.cleanOldAttempts(existingAttempts, rule.windowMs);
    
    return {
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - validAttempts.length),
      resetTime: Date.now() + rule.windowMs
    };
  }

  // Clear all rate limit data (for testing)
  clear() {
    this.attempts.clear();
  }
}

export const rateLimitManager = new RateLimitManager();
