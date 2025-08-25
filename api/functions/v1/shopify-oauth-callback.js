// OAuth callback proxy - forwards to the working callback
export default async function handler(req, res) {
  console.log('🔵 OAuth callback proxy request:', {
    method: req.method,
    shop: req.query.shop,
    hasCode: !!req.query.code,
    url: req.url
  });

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, code, state, error: oauthError } = req.query;

    // Handle OAuth errors
    if (oauthError) {
      console.error('❌ OAuth error from Shopify:', oauthError);
      return res.status(400).json({
        error: 'OAuth authorization failed',
        details: oauthError
      });
    }

    // Validate required parameters
    if (!shop || !code) {
      console.error('❌ Missing OAuth parameters:', { shop: !!shop, code: !!code });
      return res.status(400).json({
        error: 'Missing OAuth parameters',
        details: 'Both shop and code are required'
      });
    }

    console.log('🔄 Forwarding to working callback endpoint');
    
    // Forward to the working OAuth callback
    const callbackUrl = `/api/oauth/shopify-callback?${new URLSearchParams({
      shop,
      code,
      ...(state && { state })
    })}`;

    // Internal redirect to the working callback
    return res.redirect(302, callbackUrl);

  } catch (error) {
    console.error('❌ OAuth callback proxy error:', error);
    return res.status(500).json({
      error: 'OAuth callback failed',
      details: error.message
    });
  }
}