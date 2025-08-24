import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { MerchantSessionService } from '../../src/services/merchantSessionService';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const shopifyClientId = process.env.VITE_SHOPIFY_CLIENT_ID!;
const shopifyClientSecret = process.env.SHOPIFY_CLIENT_SECRET!;
const appUrl = process.env.VITE_APP_URL || 'https://ras-5.vercel.app';

// HMAC validation for security
async function verifyHmac(data: string, signature: string, secret: string): Promise<boolean> {
  const crypto = globalThis.crypto;
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signature_hex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  return signature_hex === signature;
}

// Token encryption helper
async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(shopifyClientSecret.substring(0, 32).padEnd(32, '0')),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, shop, state, hmac, timestamp, host } = req.query;
    
    if (!code || !shop || !hmac) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Verify HMAC for security
    const queryString = new URLSearchParams({
      ...(code && { code: code as string }),
      ...(shop && { shop: shop as string }),
      ...(state && { state: state as string }),
      ...(timestamp && { timestamp: timestamp as string }),
      ...(host && { host: host as string })
    }).toString();
    
    const isValidHmac = await verifyHmac(queryString, hmac as string, shopifyClientSecret);
    if (!isValidHmac) {
      return res.status(403).json({ error: 'Invalid HMAC signature' });
    }

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
      throw new Error('Failed to exchange code for access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Encrypt the access token
    const encryptedToken = await encryptToken(accessToken);

    // Store merchant data in Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .upsert({
        shop_domain: shop,
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
      console.error('Error storing merchant:', merchantError);
      return res.status(500).json({ error: 'Failed to store merchant data' });
    }

    // Create JWT session token
    const sessionToken = await MerchantSessionService.createSession({
      merchantId: merchant.id,
      shopDomain: shop as string
    });

    // Log installation event
    await supabase
      .from('analytics_events')
      .insert({
        merchant_id: merchant.id,
        event_type: 'app_installed',
        event_data: {
          shop_domain: shop,
          installation_method: 'oauth',
          timestamp: new Date().toISOString()
        }
      });

    console.log('✅ OAuth completed successfully:', {
      merchantId: merchant.id,
      shopDomain: shop,
      sessionCreated: !!sessionToken
    });

    // Construct host parameter for redirect
    const hostParam = host as string || btoa(`${shop}/admin`).replace(/=/g, '');
    const redirectUrl = `${appUrl}/auth/inline?shop=${encodeURIComponent(shop as string)}&host=${encodeURIComponent(hostParam)}`;

    // Set session cookie and redirect
    const response = new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Content-Security-Policy': 'frame-ancestors https://admin.shopify.com https://*.myshopify.com;'
      }
    });

    // Add session cookie to response
    MerchantSessionService.setSessionCookie(response, sessionToken);

    // Convert to Vercel response format
    const cookieHeader = response.headers.get('Set-Cookie');
    if (cookieHeader) {
      res.setHeader('Set-Cookie', cookieHeader);
    }
    res.setHeader('Content-Security-Policy', 'frame-ancestors https://admin.shopify.com https://*.myshopify.com;');
    
    return res.redirect(302, redirectUrl);

  } catch (error) {
    console.error('❌ OAuth callback error:', error);
    return res.status(500).json({ 
      error: 'OAuth callback failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}