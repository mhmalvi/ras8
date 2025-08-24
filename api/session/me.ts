import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MerchantSessionService } from '../../src/services/merchantSessionService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract session token from request
    const token = MerchantSessionService.extractTokenFromRequest(new Request('http://localhost', {
      headers: {
        'authorization': req.headers.authorization || '',
        'cookie': req.headers.cookie || ''
      }
    }));

    if (!token) {
      return res.status(401).json({ 
        error: 'No session token found',
        authenticated: false,
        session: null
      });
    }

    // Validate the session
    const session = await MerchantSessionService.validateSession(token);
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Invalid or expired session',
        authenticated: false,
        session: null
      });
    }

    // Check if session is expired (additional validation)
    const now = Math.floor(Date.now() / 1000);
    if (session.exp < now) {
      return res.status(401).json({ 
        error: 'Session expired',
        authenticated: false,
        session: null
      });
    }

    // Return session data
    return res.status(200).json({
      authenticated: true,
      session: {
        merchantId: session.merchantId,
        shopDomain: session.shopDomain,
        sessionId: session.sessionId,
        expiresAt: new Date(session.exp * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Session validation error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      authenticated: false,
      session: null
    });
  }
}