// Dynamic CORS configuration based on environment
interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  credentials: boolean;
  maxAge: number;
}

export class CorsManager {
  private static getEnvironmentOrigins(): string[] {
    // Production domains
    if (process.env.NODE_ENV === 'production') {
      return [
        'https://pvadajelvewdazwmvppk.supabase.co',
        'https://*.lovable.app',
        'https://*.vercel.app',
        // Add custom domains when deployed
      ];
    }
    
    // Development domains
    return [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://localhost:3000',
      'https://localhost:5173',
      'https://pvadajelvewdazwmvppk.supabase.co',
      'https://*.lovable.app',
    ];
  }

  static getConfig(): CorsConfig {
    return {
      allowedOrigins: this.getEnvironmentOrigins(),
      allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: [
        'authorization',
        'x-client-info',
        'apikey',
        'content-type',
        'x-requested-with',
        'x-shopify-hmac-sha256',
        'x-shopify-topic',
        'x-shopify-shop-domain'
      ],
      credentials: true,
      maxAge: 86400 // 24 hours
    };
  }

  static getHeaders(origin?: string): Record<string, string> {
    const config = this.getConfig();
    
    // Check if origin is allowed
    const isOriginAllowed = origin && config.allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      if (allowed.includes('*')) {
        const pattern = allowed.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(origin);
      }
      return allowed === origin;
    });

    return {
      'Access-Control-Allow-Origin': isOriginAllowed ? origin! : config.allowedOrigins[0],
      'Access-Control-Allow-Methods': config.allowedMethods.join(', '),
      'Access-Control-Allow-Headers': config.allowedHeaders.join(', '),
      'Access-Control-Allow-Credentials': config.credentials.toString(),
      'Access-Control-Max-Age': config.maxAge.toString(),
    };
  }

  // Middleware for edge functions
  static handleRequest(req: Request): Response | null {
    if (req.method === 'OPTIONS') {
      const origin = req.headers.get('origin');
      return new Response(null, {
        status: 200,
        headers: this.getHeaders(origin)
      });
    }
    return null;
  }

  // Apply CORS headers to any response
  static applyHeaders(response: Response, origin?: string): Response {
    const corsHeaders = this.getHeaders(origin);
    const newHeaders = new Headers(response.headers);
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
}

// Simplified CORS headers for edge functions
export const getStandardCorsHeaders = () => CorsManager.getHeaders();