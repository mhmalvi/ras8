/**
 * Vite plugin to set proper CSP headers for Shopify embedded apps
 */
export default function cspHeaderPlugin() {
  return {
    name: 'csp-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Set CSP headers optimized for Shopify Partner Platform
        res.setHeader('Content-Security-Policy', [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.shopify.com https://*.shopifycloud.com https://ras-5.vercel.app",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.shopify.com",
          "font-src 'self' https://fonts.gstatic.com https://cdn.shopify.com",
          "img-src 'self' data: https: blob: https://cdn.shopify.com https://*.shopifycloud.com",
          "connect-src 'self' https: wss: ws: https://*.supabase.co wss://*.supabase.co https://*.shopify.com https://*.shopifycloud.com wss://*.shopifycloud.com https://ras-5.vercel.app ws://localhost:* wss://localhost:* https://partners.shopify.com",
          "frame-ancestors 'self' https://*.shopify.com https://*.shopifycloud.com https://admin.shopify.com https://partners.shopify.com",
          "child-src 'self' https://*.shopify.com https://*.shopifycloud.com",
          "form-action 'self' https://*.shopify.com https://partners.shopify.com",
          "object-src 'none'",
          "base-uri 'self'"
        ].join('; '));

        // Set X-Frame-Options for iframe compatibility
        res.setHeader('X-Frame-Options', 'ALLOWALL');
        
        // Allow embedding in Shopify Admin
        res.setHeader('X-Content-Type-Options', 'nosniff');
        
        next();
      });
    }
  };
}