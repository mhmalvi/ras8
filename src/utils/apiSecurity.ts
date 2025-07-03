
import { SecurityMiddleware } from '@/middleware/securityMiddleware';

// API security utilities for frontend requests
export class ApiSecurity {
  // Secure API request wrapper
  static async secureRequest<T>(
    url: string,
    options: RequestInit = {},
    requireAuth = true
  ): Promise<T> {
    try {
      // Get auth token if required
      let headers = { ...options.headers };
      
      if (requireAuth) {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Authentication required');
        }
        headers = {
          ...headers,
          'Authorization': `Bearer ${session.access_token}`
        };
      }

      // Add security headers
      headers = {
        ...headers,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };

      // Sanitize request body
      let body = options.body;
      if (body && typeof body === 'string') {
        try {
          const parsedBody = JSON.parse(body);
          const sanitizedBody = SecurityMiddleware.sanitizeInput(parsedBody);
          body = JSON.stringify(sanitizedBody);
        } catch (error) {
          console.warn('Could not sanitize request body:', error);
        }
      }

      const response = await fetch(url, {
        ...options,
        headers,
        body
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      return await response.json() as T;
    } catch (error) {
      console.error('Secure API request failed:', error);
      throw error;
    }
  }

  // Validate merchant access for API calls
  static async validateMerchantAccess(merchantId: string): Promise<boolean> {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('merchant_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      return profile?.merchant_id === merchantId;
    } catch (error) {
      console.error('Merchant access validation failed:', error);
      return false;
    }
  }

  // Rate limiting check for client-side
  static checkRateLimit(action: string, limit: number = 100): boolean {
    const key = `rate_limit_${action}`;
    const now = Date.now();
    const windowStart = now - (60 * 60 * 1000); // 1 hour window

    // Get existing requests from localStorage
    const existingRequests = JSON.parse(localStorage.getItem(key) || '[]') as number[];
    
    // Filter out old requests
    const recentRequests = existingRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (recentRequests.length >= limit) {
      console.warn(`Rate limit exceeded for action: ${action}`);
      return false;
    }

    // Add current request
    recentRequests.push(now);
    localStorage.setItem(key, JSON.stringify(recentRequests));
    
    return true;
  }
}
