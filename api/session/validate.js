import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shopifyClientSecret = process.env.SHOPIFY_CLIENT_SECRET;
const jwtSecret = process.env.JWT_SECRET_KEY;

// Helper to verify Shopify session token (App Bridge)
function verifySessionToken(token, shop) {
  try {
    // Shopify session tokens are JWT tokens signed with the client secret
    const decoded = jwt.verify(token, shopifyClientSecret, {
      algorithms: ['HS256']
    });
    
    // Verify the shop domain matches
    if (decoded.dest !== `https://${shop}`) {
      console.error('Shop domain mismatch in session token');
      return null;
    }
    
    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      console.error('Session token expired');
      return null;
    }
    
    return decoded;
  } catch (error) {
    console.error('Session token verification failed:', error.message);
    return null;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, embedded, timestamp } = req.body;
    const authHeader = req.headers.authorization;
    const shopHeader = req.headers.shop;

    console.log('🔍 Session validation request:', {
      shop: shop || shopHeader,
      embedded,
      hasAuthHeader: !!authHeader,
      timestamp
    });

    // Validate required parameters
    const shopDomain = shop || shopHeader;
    if (!shopDomain) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Shop domain is required' 
      });
    }

    let sessionValid = false;
    let merchantData = null;

    // For embedded apps, verify App Bridge session token
    if (embedded && authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      if (shopifyClientSecret) {
        const decodedToken = verifySessionToken(token, shopDomain);
        
        if (decodedToken) {
          console.log('✅ App Bridge session token validated');
          sessionValid = true;
        } else {
          console.log('❌ App Bridge session token validation failed');
        }
      } else {
        console.warn('⚠️ Cannot verify session token: SHOPIFY_CLIENT_SECRET not configured');
      }
    }

    // Check merchant status in database
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Get merchant with token info
        const { data: merchantWithToken, error: merchantError } = await supabase
          .rpc('get_merchant_with_token', { p_merchant_id: null })
          .eq('shop_domain', shopDomain)
          .single();

        if (merchantError && merchantError.code !== 'PGRST116') {
          console.error('Database query error:', merchantError);
        } else if (merchantWithToken) {
          merchantData = merchantWithToken;
          
          // Check if merchant is active and token is valid
          const isActive = merchantData.status === 'active';
          const hasValidToken = merchantData.token_is_valid === true;
          const isTokenFresh = merchantData.last_verified_at && 
            new Date(merchantData.last_verified_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

          if (isActive && hasValidToken && isTokenFresh) {
            sessionValid = true;
            console.log('✅ Merchant database validation passed');
          } else {
            console.log('❌ Merchant database validation failed:', {
              isActive,
              hasValidToken,
              isTokenFresh
            });
          }
        }
      } catch (dbError) {
        console.error('Database validation error:', dbError);
      }
    }

    // Alternative validation: check session cookie for standalone users
    if (!sessionValid && !embedded) {
      const sessionCookie = req.cookies?.sessionToken;
      
      if (sessionCookie && jwtSecret) {
        try {
          const decoded = jwt.verify(sessionCookie, jwtSecret);
          
          if (decoded.shopDomain === shopDomain) {
            sessionValid = true;
            console.log('✅ Session cookie validation passed');
          }
        } catch (cookieError) {
          console.log('❌ Session cookie validation failed:', cookieError.message);
        }
      }
    }

    const response = {
      valid: sessionValid,
      shop: shopDomain,
      timestamp: new Date().toISOString(),
      merchant: merchantData ? {
        id: merchantData.merchant_id,
        status: merchantData.status,
        tokenValid: merchantData.token_is_valid,
        lastVerified: merchantData.last_verified_at
      } : null
    };

    console.log('📋 Session validation result:', {
      shop: shopDomain,
      valid: sessionValid,
      embedded,
      hasMerchant: !!merchantData
    });

    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return res.status(500).json({ 
      valid: false, 
      error: 'Internal server error' 
    });
  }
}