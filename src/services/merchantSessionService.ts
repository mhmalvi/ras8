import { SignJWT, jwtVerify } from 'jose';

interface MerchantSession {
  merchantId: string;
  shopDomain: string;
  sessionId: string;
  exp: number;
  iat: number;
}

interface CreateSessionPayload {
  merchantId: string;
  shopDomain: string;
}

class MerchantSessionService {
  private static readonly JWT_SECRET_KEY = new TextEncoder().encode(
    process.env.JWT_SECRET_KEY || 'fallback-development-key-change-in-production'
  );
  
  private static readonly SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds
  private static readonly COOKIE_NAME = 'merchant_session';

  /**
   * Creates a signed JWT session token for a merchant
   */
  static async createSession(payload: CreateSessionPayload): Promise<string> {
    const sessionId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    
    const jwt = await new SignJWT({
      merchantId: payload.merchantId,
      shopDomain: payload.shopDomain,
      sessionId,
      iat: now,
      exp: now + this.SESSION_DURATION
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(now)
      .setExpirationTime(now + this.SESSION_DURATION)
      .sign(this.JWT_SECRET_KEY);

    return jwt;
  }

  /**
   * Validates and decodes a JWT session token
   */
  static async validateSession(token: string): Promise<MerchantSession | null> {
    try {
      const { payload } = await jwtVerify(token, this.JWT_SECRET_KEY);
      
      return {
        merchantId: payload.merchantId as string,
        shopDomain: payload.shopDomain as string,
        sessionId: payload.sessionId as string,
        exp: payload.exp as number,
        iat: payload.iat as number
      };
    } catch (error) {
      console.error('❌ JWT validation failed:', error);
      return null;
    }
  }

  /**
   * Creates secure cookie options for embedded Shopify apps
   */
  static getCookieOptions() {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none' as const, // Required for embedded apps
      maxAge: this.SESSION_DURATION,
      path: '/'
    };
  }

  /**
   * Extracts session token from request headers or cookies
   */
  static extractTokenFromRequest(req: Request): string | null {
    // Try Authorization header first
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // Try cookie
    const cookies = req.headers.get('cookie');
    if (cookies) {
      const sessionCookie = cookies
        .split(';')
        .find(c => c.trim().startsWith(`${this.COOKIE_NAME}=`));
      
      if (sessionCookie) {
        return sessionCookie.split('=')[1];
      }
    }

    return null;
  }

  /**
   * Creates a Response with session cookie set
   */
  static setSessionCookie(response: Response, token: string): Response {
    const cookieOptions = this.getCookieOptions();
    const cookieValue = `${this.COOKIE_NAME}=${token}; Path=${cookieOptions.path}; Max-Age=${cookieOptions.maxAge}; SameSite=${cookieOptions.sameSite}; ${cookieOptions.httpOnly ? 'HttpOnly;' : ''} ${cookieOptions.secure ? 'Secure;' : ''}`.trim();
    
    response.headers.set('Set-Cookie', cookieValue);
    return response;
  }

  /**
   * Creates a Response that clears the session cookie
   */
  static clearSessionCookie(response: Response): Response {
    const cookieValue = `${this.COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=none; HttpOnly; Secure;`;
    response.headers.set('Set-Cookie', cookieValue);
    return response;
  }
}

export { MerchantSessionService };
export type { MerchantSession, CreateSessionPayload };