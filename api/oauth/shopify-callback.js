import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shopifyClientId = process.env.VITE_SHOPIFY_CLIENT_ID || process.env.SHOPIFY_CLIENT_ID;
const shopifyClientSecret = process.env.SHOPIFY_CLIENT_SECRET;

// Simple base64 encoding for access tokens
function encryptToken(token) {
  return Buffer.from(token).toString('base64');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables first
    if (!supabaseUrl || !supabaseServiceKey || !shopifyClientId || !shopifyClientSecret) {
      const missing = [];
      if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
      if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');  
      if (!shopifyClientId) missing.push('VITE_SHOPIFY_CLIENT_ID/SHOPIFY_CLIENT_ID');
      if (!shopifyClientSecret) missing.push('SHOPIFY_CLIENT_SECRET');
      
      console.error('❌ Missing environment variables:', missing);
      return res.status(500).json({ error: `Missing environment variables: ${missing.join(', ')}` });
    }

    const { code, shop, state } = req.query;
    
    if (!code || !shop) {
      console.error('❌ Missing OAuth parameters:', { code: !!code, shop });
      return res.status(400).json({ error: 'Missing required OAuth parameters: code and shop' });
    }

    console.log('✅ OAuth callback received via Vercel:', { shop, code: String(code).substring(0, 10) + '...', state });

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: shopifyClientId,
        client_secret: shopifyClientSecret,
        code: code,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', tokenResponse.status);
      const errorText = await tokenResponse.text();
      console.error('Token exchange error details:', errorText);
      throw new Error('Failed to exchange code for access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('❌ No access token in response:', tokenData);
      throw new Error('No access token received from Shopify');
    }

    // Encrypt the access token
    const encryptedToken = encryptToken(accessToken);

    // Store merchant data in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .upsert({
        shop_domain: String(shop),
        access_token: encryptedToken,
        token_encrypted_at: new Date().toISOString(),
        token_encryption_version: 2,
        plan_type: 'starter',
        settings: {
          installation_date: new Date().toISOString(),
          app_version: '1.0.0',
          oauth_completed: true
        }
      }, {
        onConflict: 'shop_domain'
      })
      .select()
      .single();

    if (merchantError) {
      console.error('❌ Error storing merchant:', merchantError);
      throw new Error('Failed to store merchant data: ' + merchantError.message);
    }

    // Log installation event
    await supabase
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: 'app_installed',
        event_data: {
          shop_domain: shop,
          installation_method: 'oauth_vercel',
          timestamp: new Date().toISOString()
        }
      });

    console.log('✅ OAuth installation complete for merchant:', merchant.id);

    // Construct host parameter (base64 encoded shop/admin)
    const hostParam = btoa(`${shop}/admin`).replace(/=/g, '');
    const appUrl = process.env.VITE_APP_URL || 'https://ras-5.vercel.app';
    
    // Redirect back to the app with proper parameters
    const redirectUrl = `${appUrl}/auth/inline?shop=${encodeURIComponent(String(shop))}&host=${encodeURIComponent(hostParam)}`;
    
    console.log('🔄 Redirecting to:', redirectUrl);
    
    // Send HTML redirect response
    const redirectHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>App Installation Complete</title>
      <meta charset="utf-8">
      <script src="https://cdn.shopify.com/shopifycloud/app_bridge.js"></script>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          console.log('🎉 App installation successful, redirecting...');
          
          // Try App Bridge redirect first (for embedded context)
          if (window.location !== window.parent.location) {
            try {
              const app = window.ShopifyApp.createApp({
                apiKey: '${shopifyClientId}',
                host: '${hostParam}'
              });
              
              app.dispatch(window.ShopifyApp.actions.Redirect.create(window.ShopifyApp.Group.App, {
                path: '/auth/inline?shop=${encodeURIComponent(String(shop))}&host=${encodeURIComponent(hostParam)}'
              }));
              
              return;
            } catch (e) {
              console.log('App Bridge redirect failed, using window redirect:', e);
            }
          }
          
          // Fallback to window redirect
          setTimeout(() => {
            window.location.href = '${redirectUrl}';
          }, 100);
        });
      </script>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; padding: 50px;">
      <h2 style="color: #00848E;">✅ Installation Complete!</h2>
      <p>Redirecting to your app...</p>
      <p><a href="${redirectUrl}">Click here if you're not redirected automatically</a></p>
    </body>
    </html>`;
    
    return res.status(200).setHeader('Content-Type', 'text/html').send(redirectHtml);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return res.status(500).json({ 
      error: 'OAuth callback failed', 
      details: error.message || 'Unknown error' 
    });
  }
}