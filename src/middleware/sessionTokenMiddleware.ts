/**
 * Shopify Session Token Middleware
 * Validates App Bridge session tokens for API calls
 */

import jwt from 'jsonwebtoken';

export interface ShopifySessionPayload {
  iss: string;        // https://shop-domain.myshopify.com/admin
  dest: string;       // https://shop-domain.myshopify.com
  aud: string;        // Shopify API key
  sub: string;        // User ID
  exp: number;        // Expiration
  nbf: number;        // Not before
  iat: number;        // Issued at
  jti: string;        // JWT ID
  sid: string;        // Session ID
}

export interface ValidatedSession {
  shop: string;
  userId: string;
  sessionId: string;
  payload: ShopifySessionPayload;
}

/**
 * Extract session token from App Bridge
 * Call this from your React components
 */
export const getSessionToken = async (app: any): Promise<string | null> => {
  try {
    if (!app) {
      console.error('App Bridge instance not available');
      return null;
    }

    // Get session token from App Bridge
    const token = await app.idToken();
    
    if (!token) {
      console.error('No session token available from App Bridge');
      return null;
    }

    return token;
  } catch (error) {
    console.error('Failed to get session token:', error);
    return null;
  }
};

/**
 * Validate Shopify session token (server-side)
 */
export const validateSessionToken = async (
  token: string,
  shopifyClientSecret: string
): Promise<ValidatedSession | null> => {
  try {
    // Decode without verification first to get the payload
    const decoded = jwt.decode(token, { complete: true }) as any;
    
    if (!decoded || !decoded.payload) {
      console.error('Invalid JWT structure');
      return null;
    }

    const payload = decoded.payload as ShopifySessionPayload;
    
    // Extract shop domain from iss claim
    const issMatch = payload.iss.match(/https:\/\/([^\/]+)\/admin/);
    if (!issMatch) {
      console.error('Invalid iss claim in JWT');
      return null;
    }
    
    const shop = issMatch[1];

    // Verify the JWT signature
    try {
      jwt.verify(token, shopifyClientSecret, {
        audience: payload.aud,
        issuer: payload.iss,
        algorithms: ['HS256']
      });
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return null;
    }

    // Check expiration
    if (Date.now() >= payload.exp * 1000) {
      console.error('Session token expired');
      return null;
    }

    return {
      shop,
      userId: payload.sub,
      sessionId: payload.sid,
      payload
    };
    
  } catch (error) {
    console.error('Session token validation error:', error);
    return null;
  }
};

/**
 * Express/Edge Function middleware for session token validation
 */
export const sessionTokenMiddleware = (shopifyClientSecret: string) => {
  return async (req: Request): Promise<{ session: ValidatedSession | null; error?: string }> => {
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        session: null,
        error: 'Missing or invalid Authorization header'
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const validatedSession = await validateSessionToken(token, shopifyClientSecret);
    
    if (!validatedSession) {
      return {
        session: null,
        error: 'Invalid session token'
      };
    }

    return { session: validatedSession };
  };
};