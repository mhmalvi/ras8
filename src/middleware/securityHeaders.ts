interface SecurityHeadersConfig {
  contentSecurityPolicy?: {
    directives: Record<string, string[]>;
    reportOnly?: boolean;
  };
  strictTransportSecurity?: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  };
  crossOriginEmbedderPolicy?: 'require-corp' | 'unsafe-none';
  crossOriginOpenerPolicy?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  crossOriginResourcePolicy?: 'same-site' | 'same-origin' | 'cross-origin';
  permissions?: string[];
  referrerPolicy?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
}

class SecurityHeadersManager {
  private config: SecurityHeadersConfig;

  constructor(config?: Partial<SecurityHeadersConfig>) {
    this.config = {
      contentSecurityPolicy: {
        directives: {
          'default-src': ["'self'"],
          'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com', 'https://checkout.stripe.com'],
          'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          'font-src': ["'self'", 'https://fonts.gstatic.com'],
          'img-src': ["'self'", 'data:', 'https:', 'blob:'],
          'media-src': ["'self'"],
          'object-src': ["'none'"],
          'base-uri': ["'self'"],
          'form-action': ["'self'"],
          'frame-ancestors': ["'none'"],
          'upgrade-insecure-requests': [],
          'connect-src': ["'self'", 'https://api.openai.com', 'https://api.stripe.com', 'wss://*.supabase.co', 'https://*.supabase.co']
        },
        reportOnly: false
      },
      strictTransportSecurity: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
      },
      crossOriginEmbedderPolicy: 'unsafe-none',
      crossOriginOpenerPolicy: 'same-origin',
      crossOriginResourcePolicy: 'cross-origin',
      permissions: [
        'geolocation=()',
        'microphone=()',
        'camera=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()'
      ],
      referrerPolicy: 'strict-origin-when-cross-origin',
      ...config
    };
  }

  generateHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    // Content Security Policy
    if (this.config.contentSecurityPolicy) {
      const csp = this.config.contentSecurityPolicy;
      const directives = Object.entries(csp.directives)
        .map(([directive, sources]) => {
          if (sources.length === 0) return directive;
          return `${directive} ${sources.join(' ')}`;
        })
        .join('; ');

      const headerName = csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
      headers[headerName] = directives;
    }

    // Strict Transport Security
    if (this.config.strictTransportSecurity) {
      const hsts = this.config.strictTransportSecurity;
      let value = `max-age=${hsts.maxAge}`;
      if (hsts.includeSubDomains) value += '; includeSubDomains';
      if (hsts.preload) value += '; preload';
      headers['Strict-Transport-Security'] = value;
    }

    // Cross-Origin Headers
    if (this.config.crossOriginEmbedderPolicy) {
      headers['Cross-Origin-Embedder-Policy'] = this.config.crossOriginEmbedderPolicy;
    }

    if (this.config.crossOriginOpenerPolicy) {
      headers['Cross-Origin-Opener-Policy'] = this.config.crossOriginOpenerPolicy;
    }

    if (this.config.crossOriginResourcePolicy) {
      headers['Cross-Origin-Resource-Policy'] = this.config.crossOriginResourcePolicy;
    }

    // Security Headers
    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';

    // Permissions Policy
    if (this.config.permissions && this.config.permissions.length > 0) {
      headers['Permissions-Policy'] = this.config.permissions.join(', ');
    }

    // Referrer Policy
    if (this.config.referrerPolicy) {
      headers['Referrer-Policy'] = this.config.referrerPolicy;
    }

    return headers;
  }

  // Middleware function for applying security headers
  middleware() {
    const securityHeaders = this.generateHeaders();
    
    return (request: Request, response: any, next: () => void) => {
      // Apply security headers
      Object.entries(securityHeaders).forEach(([name, value]) => {
        response.headers = {
          ...response.headers,
          [name]: value
        };
      });

      return next();
    };
  }

  // Apply headers to a Response object
  applyToResponse(response: Response): Response {
    const headers = this.generateHeaders();
    const newHeaders = new Headers(response.headers);
    
    Object.entries(headers).forEach(([name, value]) => {
      newHeaders.set(name, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }

  // Validate if current environment meets security requirements
  validateEnvironment(): { secure: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check if running over HTTPS in production
    if (typeof window !== 'undefined' && location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('Application should be served over HTTPS in production');
    }

    // Check for secure cookie settings
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        if (cookie.includes('=') && !cookie.includes('Secure') && !cookie.includes('HttpOnly')) {
          issues.push('Cookies should include Secure and HttpOnly flags');
        }
      });
    }

    return {
      secure: issues.length === 0,
      issues
    };
  }

  // Update CSP directives dynamically
  updateCSP(directive: string, sources: string[]) {
    if (this.config.contentSecurityPolicy) {
      this.config.contentSecurityPolicy.directives[directive] = sources;
    }
  }

  // Add a new CSP source to existing directive
  addCSPSource(directive: string, source: string) {
    if (this.config.contentSecurityPolicy?.directives[directive]) {
      const existing = this.config.contentSecurityPolicy.directives[directive];
      if (!existing.includes(source)) {
        existing.push(source);
      }
    }
  }
}

// Production configuration
const productionSecurityHeaders = new SecurityHeadersManager({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", 'https://js.stripe.com', 'https://checkout.stripe.com'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'media-src': ["'self'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': [],
      'connect-src': ["'self'", 'https://api.openai.com', 'https://api.stripe.com', 'wss://*.supabase.co', 'https://*.supabase.co']
    },
    reportOnly: false
  }
});

// Development configuration (more permissive)
const developmentSecurityHeaders = new SecurityHeadersManager({
  contentSecurityPolicy: {
    directives: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://js.stripe.com'],
      'style-src': ["'self'", "'unsafe-inline'"],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'connect-src': ["'self'", 'https:', 'wss:', 'ws://localhost:*']
    },
    reportOnly: true // Use report-only mode in development
  }
});

export const securityHeaders = process.env.NODE_ENV === 'production' 
  ? productionSecurityHeaders 
  : developmentSecurityHeaders;

export { SecurityHeadersManager };