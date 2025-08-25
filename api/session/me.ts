import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET_KEY!;

// App Bridge session token validation
async function validateAppBridgeToken(token: string): Promise<{ valid: boolean; payload?: any }> {
  try {
    // In a real implementation, you would verify the App Bridge session token
    // against Shopify's servers. For now, we'll do basic JWT parsing.
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Basic validation - check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch (error) {
    console.error('❌ App Bridge token validation error:', error);
    return { valid: false };
  }
}

// Validate merchant session JWT
function validateMerchantJWT(token: string): { valid: boolean; payload?: any } {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signature) {
      return { valid: false };
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', jwtSecret)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return { valid: false };
    }

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, payload };
  } catch (error) {
    console.error('❌ JWT validation error:', error);
    return { valid: false };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    const shopHeader = req.headers.shop as string;
    const sessionCookie = req.headers.cookie?.split(';')
      .find(cookie => cookie.trim().startsWith('sessionToken='))
      ?.split('=')[1];

    console.log('🔍 Session validation request:', {
      hasAuthHeader: !!authHeader,
      hasShopHeader: !!shopHeader,
      hasSessionCookie: !!sessionCookie,
      userAgent: req.headers['user-agent']?.includes('Shopify') ? 'Shopify' : 'Browser'
    });

    let merchantId: string | null = null;
    let shopDomain: string | null = null;
    let authMethod: string = 'none';

    // Try App Bridge session token first (embedded mode)
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const validation = await validateAppBridgeToken(token);
      
      if (validation.valid && validation.payload) {
        // Extract shop domain from App Bridge token
        shopDomain = validation.payload.dest?.replace('https://', '').replace('/admin', '') || shopHeader;
        authMethod = 'app_bridge';
        
        console.log('✅ App Bridge token validated:', { shopDomain });
      }
    }

    // Try session cookie (standalone mode or post-OAuth)
    if (!merchantId && sessionCookie) {
      const validation = validateMerchantJWT(sessionCookie);
      
      if (validation.valid && validation.payload) {
        merchantId = validation.payload.merchantId;
        shopDomain = validation.payload.shopDomain;
        authMethod = 'session_jwt';
        
        console.log('✅ Session JWT validated:', { merchantId, shopDomain });
      }
    }

    // If we have shop domain but no merchant ID, try to find merchant
    if (shopDomain && !merchantId) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id, shop_domain, settings')
        .eq('shop_domain', shopDomain)
        .single();

      if (merchant) {
        merchantId = merchant.id;
        console.log('✅ Merchant found by shop domain:', { merchantId, shopDomain });
      }
    }

    // Return session data
    if (merchantId && shopDomain) {
      const sessionData = {
        merchantId,
        shopDomain,
        sessionId: crypto.randomUUID(), // Generate new session ID for this request
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      return res.status(200).json({
        authenticated: true,
        session: sessionData,
        authMethod,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ No valid authentication found');
      return res.status(401).json({
        authenticated: false,
        error: 'No valid session or token found',
        authMethod,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return res.status(500).json({
      authenticated: false,
      error: 'Session validation failed',
      timestamp: new Date().toISOString()
    });
  }
}