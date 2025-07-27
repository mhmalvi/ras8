import { CorsManager } from '@/utils/corsManager';

// Enhanced security middleware for edge functions
export class EdgeFunctionSecurity {
  // Rate limiting with Redis-like in-memory store
  private static rateLimitStore = new Map<string, { count: number; resetTime: number }>();

  static async applySecurityHeaders(req: Request, response: Response): Promise<Response> {
    const origin = req.headers.get('origin');
    
    // Apply CORS
    const corsResponse = CorsManager.applyHeaders(response, origin);
    
    // Add security headers
    const secureHeaders = new Headers(corsResponse.headers);
    
    // Security headers
    secureHeaders.set('X-Content-Type-Options', 'nosniff');
    secureHeaders.set('X-Frame-Options', 'DENY');
    secureHeaders.set('X-XSS-Protection', '1; mode=block');
    secureHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    secureHeaders.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    // Only add HSTS in production HTTPS
    if (req.url.startsWith('https://')) {
      secureHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    return new Response(corsResponse.body, {
      status: corsResponse.status,
      statusText: corsResponse.statusText,
      headers: secureHeaders
    });
  }

  static async checkRateLimit(req: Request, endpoint: string, limit: number = 100, windowMs: number = 60000): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const clientId = this.getClientId(req);
    const key = `${clientId}:${endpoint}`;
    const now = Date.now();
    
    const existing = this.rateLimitStore.get(key);
    
    // Reset if window expired
    if (!existing || now > existing.resetTime) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      };
    }
    
    // Check if limit exceeded
    if (existing.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: existing.resetTime
      };
    }
    
    // Increment count
    existing.count++;
    this.rateLimitStore.set(key, existing);
    
    return {
      allowed: true,
      remaining: limit - existing.count,
      resetTime: existing.resetTime
    };
  }

  private static getClientId(req: Request): string {
    // Try to get user ID from authorization header
    const auth = req.headers.get('authorization');
    if (auth?.startsWith('Bearer ')) {
      try {
        const token = auth.slice(7);
        const payload = JSON.parse(atob(token.split('.')[1]));
        return `user:${payload.sub}`;
      } catch {
        // Fall through to IP-based identification
      }
    }
    
    // Use IP as fallback
    return `ip:${this.getClientIP(req)}`;
  }

  private static getClientIP(req: Request): string {
    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    
    const realIP = req.headers.get('x-real-ip');
    if (realIP) return realIP;
    
    const cfIP = req.headers.get('cf-connecting-ip');
    if (cfIP) return cfIP;
    
    return 'unknown';
  }

  // Validate request inputs
  static validateRequestBody(body: any, requiredFields: string[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!body || typeof body !== 'object') {
      errors.push('Request body must be a valid JSON object');
      return { valid: false, errors };
    }
    
    for (const field of requiredFields) {
      if (!(field in body) || body[field] === null || body[field] === undefined) {
        errors.push(`Missing required field: ${field}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Sanitize string inputs
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .slice(0, 1000); // Limit length
  }

  // Clean up expired rate limit entries
  static cleanupRateLimit(): void {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime) {
        this.rateLimitStore.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} expired rate limit entries`);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(() => {
  EdgeFunctionSecurity.cleanupRateLimit();
}, 5 * 60 * 1000);