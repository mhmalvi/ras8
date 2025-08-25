const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shopifyClientId = process.env.VITE_SHOPIFY_CLIENT_ID;
const appUrl = process.env.VITE_APP_URL || 'https://ras-8.vercel.app';

module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, host } = req.query;
    
    if (!shop) {
      return res.status(400).json({ error: 'Missing shop parameter' });
    }

    // Validate shop domain
    const shopDomain = shop;
    if (!shopDomain.endsWith('.myshopify.com')) {
      return res.status(400).json({ error: 'Invalid shop domain' });
    }

    // Generate unique state parameter for CSRF protection
    const state = Buffer.from(JSON.stringify({
      shop: shopDomain,
      host: host || '',
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7)
    })).toString('base64url');

    // Store state temporarily in Supabase for validation (if available)
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('oauth_states')
          .insert({
            state,
            shop_domain: shopDomain,
            host_param: host || '',
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
          });
      } catch (dbError) {
        console.warn('⚠️ Could not store OAuth state in database:', dbError.message);
        // Continue without database storage for fallback
      }
    }

    // Required scopes matching shopify.app.toml
    const scopes = [
      'read_orders',
      'write_orders',
      'read_customers', 
      'read_products',
      'write_draft_orders',
      'read_inventory',
      'read_locations'
    ].join(',');

    // Build OAuth URL with correct redirect URI
    const redirectUri = `${appUrl}/auth/callback`;
    const oauthUrl = new URL(`https://${shopDomain}/admin/oauth/authorize`);
    oauthUrl.searchParams.set('client_id', shopifyClientId);
    oauthUrl.searchParams.set('scope', scopes);
    oauthUrl.searchParams.set('redirect_uri', redirectUri);
    oauthUrl.searchParams.set('state', state);

    console.log('🔐 Starting top-level OAuth for:', {
      shop: shopDomain,
      redirectUri,
      state: state.substring(0, 8) + '...'
    });

    // Create top-level redirect response (breaks out of iframe)
    const breakoutHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>H5 - Starting Installation</title>
      <meta http-equiv="Content-Security-Policy" content="frame-ancestors https://admin.shopify.com https://*.myshopify.com;">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
          text-align: center; 
          padding: 80px 20px; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin: 0;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .container { max-width: 400px; margin: 0 auto; }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 30px;
        }
        h1 { font-size: 28px; margin-bottom: 15px; font-weight: 300; }
        p { font-size: 16px; opacity: 0.9; line-height: 1.5; }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h1>Starting H5 Installation</h1>
        <p>Redirecting to Shopify for authorization...</p>
        <p><small>Shop: ${shopDomain}</small></p>
      </div>
      
      <script>
        // Force top-level navigation to break out of any iframe
        try {
          if (window.top && window.top !== window.self) {
            console.log('🔄 Breaking out of iframe to top-level OAuth');
            window.top.location.href = "${oauthUrl.toString()}";
          } else {
            console.log('🔄 Redirecting to top-level OAuth');
            window.location.href = "${oauthUrl.toString()}";
          }
        } catch (e) {
          // Fallback if cross-origin frame access is blocked
          console.log('🔄 Fallback redirect to OAuth');
          window.location.href = "${oauthUrl.toString()}";
        }
      </script>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(breakoutHtml);

  } catch (error) {
    console.error('❌ OAuth start error:', error);
    
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Installation Error</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #dc3545; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>Installation Error</h1>
      <div class="error">Unable to start H5 app installation</div>
      <p>Error: ${error.message || 'Unknown error'}</p>
      <button onclick="window.history.back()">Go Back</button>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(errorHtml);
  }
}