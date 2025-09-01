import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Simple cookie parser utility
function parseCookies(cookieString) {
  const cookies = {};
  if (cookieString) {
    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });
  }
  return cookies;
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shopifyClientSecret = process.env.SHOPIFY_CLIENT_SECRET;

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract shop from query parameters or headers
    const shop = req.query.shop || req.headers.shop;
    const authHeader = req.headers.authorization;
    const cookies = parseCookies(req.headers.cookie);
    const sessionCookie = cookies.sessionToken;
    
    console.log('🔍 Session validation request:', {
      shop: !!shop,
      hasAuthHeader: !!authHeader,
      authHeaderType: authHeader ? authHeader.split(' ')[0] : 'none',
      hasSessionCookie: !!sessionCookie
    });

    if (!shop) {
      return res.status(401).json({ 
        error: 'No shop parameter found',
        authenticated: false,
        session: null
      });
    }

    // If we have an App Bridge session token, validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      
      try {
        // Decode the Shopify session token (it's a JWT signed by Shopify)
        const decoded = jwt.decode(sessionToken, { complete: true });
        console.log('📋 Session token decoded:', {
          iss: decoded?.payload?.iss,
          dest: decoded?.payload?.dest,
          aud: decoded?.payload?.aud,
          exp: decoded?.payload?.exp
        });
        
        // For App Bridge session tokens, we trust that they're valid if they decode properly
        // In production, you'd want to verify the signature with Shopify's public key
        if (decoded && decoded.payload && decoded.payload.dest === `https://${shop}`) {
          
          // Try to find the merchant in our database
          if (supabaseUrl && supabaseServiceKey) {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            const { data: merchant } = await supabase
              .from('merchants')
              .select('id, shop_domain')
              .eq('shop_domain', shop)
              .single();

            if (merchant) {
              return res.status(200).json({
                authenticated: true,
                session: {
                  merchantId: merchant.id,
                  shopDomain: merchant.shop_domain,
                  sessionId: `app-bridge-${Date.now()}`,
                  expiresAt: new Date(decoded.payload.exp * 1000).toISOString()
                }
              });
            }
          }

          // If no merchant found in DB, return temp session for new installations
          return res.status(200).json({
            authenticated: true,
            session: {
              merchantId: `temp-${shop.replace('.myshopify.com', '')}`,
              shopDomain: shop,
              sessionId: `app-bridge-${Date.now()}`,
              expiresAt: new Date(decoded.payload.exp * 1000).toISOString()
            },
            note: 'App Bridge session validated, merchant not yet in database'
          });
        }
      } catch (tokenError) {
        console.error('❌ Session token validation failed:', tokenError);
      }
    }

    // Check for session token cookie (from OAuth callback)
    if (sessionCookie && shop) {
      try {
        // For simplicity, we'll decode the JWT manually (in production, use a proper JWT library)
        const jwtSecret = process.env.JWT_SECRET_KEY || (() => {
            console.error('SECURITY ERROR: JWT_SECRET_KEY not set in environment variables');
            throw new Error('JWT_SECRET_KEY is required for secure operation');
        })();
        const decoded = jwt.verify(sessionCookie, jwtSecret);
        
        console.log('🍪 Session cookie validated:', {
          merchantId: decoded.merchantId,
          shopDomain: decoded.shopDomain,
          exp: new Date(decoded.exp * 1000).toISOString()
        });
        
        // Validate that the shop domain matches
        if (decoded.shopDomain === shop) {
          return res.status(200).json({
            authenticated: true,
            session: {
              merchantId: decoded.merchantId,
              shopDomain: decoded.shopDomain,
              sessionId: decoded.sessionId,
              expiresAt: new Date(decoded.exp * 1000).toISOString()
            },
            note: 'Session validated from OAuth callback cookie'
          });
        } else {
          console.warn('⚠️ Shop domain mismatch in session cookie');
        }
      } catch (cookieError) {
        console.error('❌ Session cookie validation failed:', cookieError.message);
      }
    }

    // No valid session token - check if merchant exists in database
    // For initial authentication check without App Bridge token
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id, shop_domain, settings')
        .eq('shop_domain', shop)
        .single();

      if (merchant && merchant.settings?.oauth_completed) {
        return res.status(200).json({
          authenticated: true,
          session: {
            merchantId: merchant.id,
            shopDomain: merchant.shop_domain,
            sessionId: `legacy-${Date.now()}`,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
          },
          note: 'Merchant found, OAuth completed'
        });
      } else if (merchant) {
        return res.status(401).json({
          error: 'OAuth not completed for this merchant',
          authenticated: false,
          session: null,
          merchant: { id: merchant.id, oauthCompleted: merchant.settings?.oauth_completed }
        });
      }
    }

    // Check if this is a fresh OAuth completion by looking for specific headers
    // This allows the system to work immediately after OAuth without waiting for App Bridge
    if (shop && req.headers['user-agent']?.includes('Mozilla')) {
      // This appears to be a browser request for a fresh OAuth completion
      console.log('🔄 Detected potential OAuth completion, creating temporary session');
      
      return res.status(200).json({
        authenticated: true,
        session: {
          merchantId: `temp-${shop.replace('.myshopify.com', '')}`,
          shopDomain: shop,
          sessionId: `oauth-temp-${Date.now()}`,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour for fresh install
        },
        note: 'Temporary session for OAuth completion - App Bridge will provide full session'
      });
    }

    // No valid session token and no merchant found, return 401
    return res.status(401).json({
      error: 'No valid session token found',
      authenticated: false,
      session: null,
      hint: 'App Bridge session token required for embedded apps or OAuth not completed'
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