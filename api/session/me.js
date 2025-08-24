export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For now, return a simple response that the frontend can use
    // TODO: Implement proper JWT session validation once the basic flow works
    
    // Extract shop from query parameters or headers
    const shop = req.query.shop || req.headers.shop;
    
    if (!shop) {
      return res.status(401).json({ 
        error: 'No shop parameter found',
        authenticated: false,
        session: null
      });
    }

    // Temporary: return a mock authenticated session for installation testing
    // This allows the app to load while we debug the OAuth flow
    return res.status(200).json({
      authenticated: true,
      session: {
        merchantId: 'temp-merchant-id', // Temporary for testing
        shopDomain: shop,
        sessionId: 'temp-session-id',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      },
      note: 'Temporary session response for installation testing'
    });

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      authenticated: false,
      session: null,
      details: error.message || 'Unknown error'
    });
  }
}