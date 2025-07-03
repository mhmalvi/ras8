
import { supabase } from '@/integrations/supabase/client';

// Security middleware for API requests
export class SecurityMiddleware {
  // Rate limiting configuration
  private static readonly RATE_LIMITS = {
    AI_REQUESTS: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 per hour
    API_REQUESTS: { maxRequests: 1000, windowMs: 60 * 60 * 1000 }, // 1000 per hour
    WEBHOOK_REQUESTS: { maxRequests: 500, windowMs: 60 * 60 * 1000 } // 500 per hour
  };

  // Secure CORS configuration
  static getCorsHeaders(origin?: string): Record<string, string> {
    // Allowed origins for production
    const allowedOrigins = [
      'https://pvadajelvewdazwmvppk.supabase.co',
      'https://id-preview--ae225660-da98-4b24-902a-e3678e97e839.lovable.app',
      // Add your production domains here
    ];

    // In development, allow localhost
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
    }

    const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];

    return {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-merchant-id',
      'Access-Control-Max-Age': '86400', // 24 hours
      'Access-Control-Allow-Credentials': 'true'
    };
  }

  // JWT token validation
  static async validateJWTToken(authHeader?: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('JWT validation failed:', error);
        return { valid: false, error: 'Invalid or expired token' };
      }

      // Note: Supabase User type doesn't expose JWT claims directly
      // Token expiration is handled by Supabase automatically
      return { valid: true, userId: user.id };
    } catch (error) {
      console.error('JWT validation error:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }

  // Shopify HMAC validation with replay attack protection
  static async validateShopifyHMAC(
    body: string, 
    signature: string, 
    secret: string,
    timestamp?: string
  ): Promise<{ valid: boolean; error?: string }> {
    try {
      // Validate timestamp to prevent replay attacks (requests older than 5 minutes are rejected)
      if (timestamp) {
        const requestTime = parseInt(timestamp) * 1000;
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (now - requestTime > fiveMinutes) {
          return { valid: false, error: 'Request timestamp too old' };
        }
      }

      // Verify HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );

      const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const providedSignature = signature.replace('sha256=', '');
      
      if (expectedSignature !== providedSignature) {
        return { valid: false, error: 'HMAC signature mismatch' };
      }

      return { valid: true };
    } catch (error) {
      console.error('HMAC validation failed:', error);
      return { valid: false, error: 'HMAC validation error' };
    }
  }

  // Input sanitization
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  // Log security events
  static async logSecurityEvent(event: {
    type: 'auth_failure' | 'rate_limit' | 'hmac_failure' | 'access_denied';
    details: any;
    userId?: string;
    merchantId?: string;
  }): Promise<void> {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: event.merchantId || null,
          event_type: `security_${event.type}`,
          event_data: {
            ...event.details,
            user_id: event.userId,
            timestamp: new Date().toISOString(),
            ip_address: 'redacted', // Don't log actual IPs for privacy
            user_agent: 'redacted'
          }
        });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }
}
