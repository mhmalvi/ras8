import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shopifyClientId = process.env.VITE_SHOPIFY_CLIENT_ID;
const shopifyClientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const appUrl = process.env.VITE_APP_URL || 'https://ras-8.vercel.app';
const jwtSecret = process.env.JWT_SECRET_KEY || (() => {
    console.error('SECURITY ERROR: JWT_SECRET_KEY not set in environment variables');
    throw new Error('JWT_SECRET_KEY is required for secure operation');
})();

// HMAC validation for Shopify requests
function validateHmac(query, secret) {
  const { hmac, signature, ...rest } = query;
  
  if (!hmac) return false;
  
  // Build query string for validation (excluding hmac)
  const sortedParams = Object.keys(rest).sort().map(key => 
    `${key}=${rest[key]}`
  ).join('&');
  
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');
  
  return calculatedHmac === hmac;
}

// Create merchant session JWT
function createMerchantJWT(merchantData) {
  const payload = {
    merchantId: merchantData.id,
    shopDomain: merchantData.shop_domain,
    sessionId: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', jwtSecret)
    .update(`${header}.${payloadEncoded}`)
    .digest('base64url');

  return `${header}.${payloadEncoded}.${signature}`;
}

// Token encryption helper  
function encryptToken(token) {
  try {
    const key = crypto.scryptSync(shopifyClientSecret || 'fallback-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Token encryption failed:', error);
    // Return base64 encoded token as fallback
    return Buffer.from(token).toString('base64');
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, shop, state, host, hmac, timestamp } = req.query;
    
    console.log('🔄 OAuth callback received:', {
      shop: shop,
      hasCode: !!code,
      hasState: !!state,
      hasHmac: !!hmac
    });

    // Validate required parameters
    if (!code || !shop || !state) {
      console.error('❌ Missing required OAuth parameters');
      return res.status(400).json({ 
        error: 'Missing required parameters',
        details: { code: !!code, shop: !!shop, state: !!state }
      });
    }

    // Validate HMAC signature if client secret available
    if (shopifyClientSecret && !validateHmac(req.query, shopifyClientSecret)) {
      console.error('❌ Invalid HMAC signature');
      return res.status(403).json({ error: 'Invalid request signature' });
    }

    // Validate OAuth state parameter 
    try {
      // Decode and validate the state parameter
      const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
      console.log('🔍 Decoded OAuth state:', decodedState);
      
      // Validate state structure
      if (!decodedState.shop || !decodedState.timestamp || !decodedState.nonce) {
        throw new Error('Invalid state structure');
      }
      
      // Validate shop domain matches
      if (decodedState.shop !== shop) {
        throw new Error('Shop domain mismatch in state');
      }
      
      // Check state timestamp (within last hour)
      const stateTimestamp = parseInt(decodedState.timestamp);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (now - stateTimestamp > oneHour) {
        throw new Error('OAuth state expired');
      }
      
      console.log('✅ OAuth state validation passed');
      
      // If we have Supabase, try to mark as used (optional)
      if (supabaseUrl && supabaseServiceKey) {
        try {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          await supabase
            .from('oauth_states')
            .insert({
              state: state,
              shop_domain: shop,
              used_at: new Date().toISOString(),
              expires_at: new Date(now + oneHour).toISOString()
            });
        } catch (dbError) {
          console.warn('⚠️ Could not log OAuth state to database:', dbError.message);
          // Continue anyway
        }
      }
    } catch (stateError) {
      console.error('❌ OAuth state validation failed:', stateError.message);
      return res.status(400).json({ 
        error: 'Invalid or expired authentication state',
        details: stateError.message 
      });
    }

    // Exchange authorization code for access token
    console.log('🔄 Exchanging code for access token');
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
      const errorText = await tokenResponse.text();
      console.error('❌ Failed to exchange code for token:', errorText);
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('No access token received from Shopify');
    }

    // Encrypt the access token
    const encryptedToken = encryptToken(accessToken);

    // Store/update merchant data if Supabase available
    let merchant = null;
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: merchantData, error: merchantError } = await supabase
          .from('merchants')
          .upsert({
            shop_domain: shop,
            access_token: encryptedToken,
            token_encrypted_at: new Date().toISOString(),
            token_encryption_version: 3,
            plan_type: 'starter',
            settings: {
              installation_date: new Date().toISOString(),
              app_version: '8.0.0',
              oauth_completed: true,
              last_oauth_at: new Date().toISOString()
            }
          }, {
            onConflict: 'shop_domain'
          })
          .select()
          .single();

        if (merchantError) {
          console.error('❌ Failed to store merchant data:', merchantError);
        } else {
          merchant = merchantData;
          
          // Log successful installation
          await supabase
            .from('analytics_events')
            .insert({
              merchant_id: merchant.id,
              event_type: 'app_installed',
              event_data: {
                shop_domain: shop,
                installation_method: 'oauth_callback',
                timestamp: new Date().toISOString(),
                oauth_state: state
              }
            });
        }
      } catch (dbError) {
        console.warn('⚠️ Database operations failed, continuing without storage:', dbError.message);
      }
    }

    // Create merchant session JWT if we have merchant data
    let sessionToken = null;
    if (merchant) {
      sessionToken = createMerchantJWT(merchant);
    }

    console.log('✅ OAuth completed successfully:', {
      merchantId: merchant?.id || 'no-database',
      shopDomain: shop
    });

    // Create secure redirect to embedded context
    const hostParam = host || '';
    const redirectUrl = `${appUrl}/auth/inline?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(hostParam)}`;

    // Set secure session cookie if we have a session token
    if (sessionToken) {
      const cookieOptions = [
        `sessionToken=${sessionToken}`,
        'HttpOnly',
        'Secure',
        'SameSite=None',
        `Max-Age=${24 * 60 * 60}`, // 24 hours
        `Path=/`
      ].join('; ');

      res.setHeader('Set-Cookie', cookieOptions);
    }
    
    res.setHeader('Content-Security-Policy', 'frame-ancestors https://admin.shopify.com https://*.myshopify.com;');

    return res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    
    const errorHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Installation Error</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 50px; 
          background: #f8f9fa;
        }
        .error { 
          color: #dc3545; 
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 500px;
          margin: 0 auto;
        }
      </style>
    </head>
    <body>
      <div class="error">
        <h1>Installation Failed</h1>
        <p>There was an error completing the H5 app installation.</p>
        <p><strong>Error:</strong> ${error.message || 'Unknown error'}</p>
        <button onclick="window.close()">Close</button>
      </div>
    </body>
    </html>`;

    res.setHeader('Content-Type', 'text/html');
    return res.status(500).send(errorHtml);
  }
}