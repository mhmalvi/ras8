export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: {
        VITE_APP_URL: process.env.VITE_APP_URL || 'NOT_SET',
        VITE_SHOPIFY_CLIENT_ID: process.env.VITE_SHOPIFY_CLIENT_ID ? 'SET' : 'NOT_SET',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT_SET',
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? 'SET' : 'NOT_SET',
      },
      endpoints: {
        oauth_callback: '/api/oauth/shopify-callback',
        session_validation: '/api/session/me',
        returns_api: '/api/v1/returns',
        metrics_api: '/api/v1/metrics/summary'
      },
      routing: {
        app_handle: '/apps/ras',
        client_id_route: '/apps/2da34c83e89f6645ad1fb2028c7532dd',
        auth_inline: '/auth/inline',
        dashboard: '/dashboard'
      }
    };

    return res.status(200).json(healthStatus);

  } catch (error) {
    console.error('❌ Health check error:', error);
    return res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}