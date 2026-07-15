import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { withRateLimit, RATE_LIMITS } from '../_middleware/rateLimit.js';
import { withErrorHandler } from '../_middleware/errorHandler.js';
import { logger, authLogger, dbLogger } from '../_middleware/logger.js';

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
      logger.warn('Shop domain mismatch in session token', {
        shop,
        expectedDest: `https://${shop}`,
        actualDest: decoded.dest
      });
      return null;
    }

    // Verify token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp < now) {
      logger.warn('Session token expired', {
        shop,
        exp: decoded.exp,
        now,
        expiredAt: new Date(decoded.exp * 1000).toISOString()
      });
      return null;
    }

    return decoded;
  } catch (error) {
    logger.warn('Session token verification failed', {
      shop,
      error: error.message
    });
    return null;
  }
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { shop, embedded, timestamp } = req.body;
    const authHeader = req.headers.authorization;
    const shopHeader = req.headers.shop;

    logger.debug('Session validation request', {
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
          logger.debug('App Bridge session token validated', { shop: shopDomain });
          authLogger.tokenRefresh(decodedToken.sub || shopDomain, {
            shop: shopDomain,
            method: 'app-bridge',
            exp: new Date(decodedToken.exp * 1000).toISOString()
          });
          sessionValid = true;
        } else {
          logger.warn('App Bridge session token validation failed', { shop: shopDomain });
        }
      } else {
        logger.warn('Cannot verify session token: SHOPIFY_CLIENT_SECRET not configured', {
          shop: shopDomain
        });
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
          dbLogger.queryError('get_merchant_with_token', 'merchants', merchantError.message, {
            shop: shopDomain,
            code: merchantError.code
          });
        } else if (merchantWithToken) {
          merchantData = merchantWithToken;

          // Check if merchant is active and token is valid
          const isActive = merchantData.status === 'active';
          const hasValidToken = merchantData.token_is_valid === true;
          const isTokenFresh = merchantData.last_verified_at &&
            new Date(merchantData.last_verified_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

          if (isActive && hasValidToken && isTokenFresh) {
            sessionValid = true;
            logger.debug('Merchant database validation passed', {
              merchantId: merchantData.merchant_id,
              shop: shopDomain,
              status: merchantData.status
            });
          } else {
            logger.debug('Merchant database validation failed', {
              merchantId: merchantData.merchant_id,
              shop: shopDomain,
              isActive,
              hasValidToken,
              isTokenFresh
            });
          }
        }
      } catch (dbError) {
        dbLogger.queryError('session_validate', 'merchants', dbError.message, {
          shop: shopDomain,
          stack: dbError.stack
        });
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
            logger.debug('Session cookie validation passed', {
              shop: shopDomain,
              merchantId: decoded.merchantId
            });
            authLogger.tokenRefresh(decoded.merchantId, {
              shop: shopDomain,
              method: 'session-cookie'
            });
          }
        } catch (cookieError) {
          logger.warn('Session cookie validation failed', {
            shop: shopDomain,
            error: cookieError.message
          });
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

    logger.debug('Session validation result', {
      shop: shopDomain,
      valid: sessionValid,
      embedded,
      hasMerchant: !!merchantData
    });

    return res.status(200).json(response);

  } catch (error) {
    logger.error('Session validation error', {
      shop: req.body?.shop || req.headers?.shop,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    });
  }
}

// Export handler with rate limiting and error handling
export default withRateLimit(RATE_LIMITS.api, withErrorHandler(handler));