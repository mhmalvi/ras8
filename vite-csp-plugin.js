/**
 * Vite plugin to set proper CSP headers for Shopify embedded apps
 */
export default function cspHeaderPlugin() {
  return {
    name: 'csp-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Generate a nonce for inline scripts/styles
        const nonce = Buffer.from(Math.random().toString()).toString('base64').slice(0, 16);
        res.locals = res.locals || {};
        res.locals.nonce = nonce;

        // Set CSP headers optimized for Shopify Partner Platform
        // In development, allow unsafe-inline for React Refresh
        const isDev = process.env.NODE_ENV !== 'production';
        res.setHeader('Content-Security-Policy', [
          "default-src 'self'",
          isDev 
            ? `script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.shopify.com https://*.shopifycloud.com https://ras-5.vercel.app`
            : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://cdn.shopify.com https://*.shopifycloud.com https://ras-5.vercel.app`,
          `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com https://cdn.shopify.com`,
          "font-src 'self' https://fonts.gstatic.com https://cdn.shopify.com",
          "img-src 'self' data: https: blob: https://cdn.shopify.com https://*.shopifycloud.com",
          "connect-src 'self' https: wss: ws: https://*.supabase.co wss://*.supabase.co https://*.shopify.com https://*.shopifycloud.com wss://*.shopifycloud.com https://ras-5.vercel.app ws://localhost:* wss://localhost:* https://partners.shopify.com",
          "frame-ancestors 'self' *.shopify.com *.shopifycloud.com *.myshopify.com admin.shopify.com partners.shopify.com",
          "child-src 'self' https://*.shopify.com https://*.shopifycloud.com",
          "form-action 'self' https://*.shopify.com https://partners.shopify.com",
          "object-src 'none'",
          "base-uri 'self'"
        ].join('; '));

        // Set X-Frame-Options for iframe compatibility
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        
        // Allow embedding in Shopify Admin
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        // Additional security headers required by tests
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // HSTS header for HTTPS connections (tests may check this)
        if (req.headers['x-forwarded-proto'] === 'https' || req.url?.startsWith('https://')) {
          res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        
        next();
      });
    }
  };
}