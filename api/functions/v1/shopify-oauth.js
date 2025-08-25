// OAuth initiation endpoint - redirects to Shopify OAuth
export default async function handler(req, res) {
  console.log('🔵 OAuth initiation request:', {
    method: req.method,
    shop: req.query.shop || req.body?.shop,
    url: req.url
  });

  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get shop from query params or body
    const shop = req.query.shop || req.body?.shop;
    
    if (!shop) {
      console.error('❌ Missing shop parameter');
      return res.status(400).json({ 
        error: 'Missing shop parameter',
        details: 'Shop domain is required for OAuth initiation'
      });
    }

    // Validate shop domain format
    if (!shop.includes('.myshopify.com') && !shop.includes('.shopify.com')) {
      console.error('❌ Invalid shop domain format:', shop);
      return res.status(400).json({ 
        error: 'Invalid shop domain',
        details: 'Shop must be a valid Shopify domain'
      });
    }

    const clientId = process.env.VITE_SHOPIFY_CLIENT_ID || '2da34c83e89f6645ad1fb2028c7532dd';
    const appUrl = process.env.VITE_APP_URL || 'https://ras-8.vercel.app';
    
    // OAuth scopes (match shopify.app.toml)
    const scopes = [
      'read_orders',
      'write_orders', 
      'read_customers',
      'read_products',
      'write_draft_orders',
      'read_inventory',
      'read_locations'
    ].join(',');

    // Build OAuth URL
    const state = Math.random().toString(36).substring(7);
    const redirectUri = `${appUrl}/api/oauth/shopify-callback`;
    
    const oauthUrl = `https://${shop}/admin/oauth/authorize?` + new URLSearchParams({
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: state
    });

    console.log('🚀 Redirecting to Shopify OAuth:', {
      shop,
      clientId: clientId.substring(0, 8) + '...',
      redirectUri,
      scopes
    });

    // Return JSON response with redirect URL for AJAX calls
    if (req.headers.accept?.includes('application/json')) {
      return res.status(200).json({
        success: true,
        redirectUrl: oauthUrl,
        message: 'Redirect to Shopify OAuth'
      });
    }

    // HTTP redirect for direct navigation
    return res.redirect(302, oauthUrl);

  } catch (error) {
    console.error('❌ OAuth initiation error:', error);
    return res.status(500).json({
      error: 'OAuth initiation failed',
      details: error.message
    });
  }
}