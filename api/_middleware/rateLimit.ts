import type { VercelRequest, VercelResponse } from '@vercel/node';
import { securityLogger } from './logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key];
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

/**
 * Rate limit checker that returns result without applying response
 */
export function checkRateLimit(
  req: VercelRequest,
  config: RateLimitConfig
): RateLimitResult {
  const ip = (req.headers['x-forwarded-for'] as string) ||
             (req.headers['x-real-ip'] as string) ||
             'unknown';
  const path = req.url || 'unknown';
  const key = `${ip}:${path}`;
  const now = Date.now();

  if (!store[key] || store[key].resetTime < now) {
    // Initialize or reset
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      reset: store[key].resetTime,
      limit: config.maxRequests,
    };
  }

  store[key].count++;

  if (store[key].count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      reset: store[key].resetTime,
      limit: config.maxRequests,
    };
  }

  return {
    allowed: true,
    remaining: config.maxRequests - store[key].count,
    reset: store[key].resetTime,
    limit: config.maxRequests,
  };
}

/**
 * Rate limit middleware that applies rate limiting and sets headers
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (req: VercelRequest, res: VercelResponse) => Promise<any> | any
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const result = checkRateLimit(req, config);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.reset).toISOString());

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);
      res.setHeader('Retry-After', retryAfter.toString());

      // Log rate limit violation
      const ip = (req.headers['x-forwarded-for'] as string) ||
                 (req.headers['x-real-ip'] as string) ||
                 'unknown';
      securityLogger.rateLimitExceeded(ip, req.url || 'unknown', {
        limit: result.limit,
        resetAt: new Date(result.reset).toISOString(),
      });

      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
        retryAfter,
        resetAt: new Date(result.reset).toISOString(),
      });
    }

    return handler(req, res);
  };
}

/**
 * Predefined rate limit configurations
 */
export const RATE_LIMITS = {
  // Authentication endpoints - strict (5 attempts per 15 minutes)
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,
  },

  // Sign up - very strict (3 attempts per hour)
  signUp: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
  },

  // OAuth callback - moderate (10 per 5 minutes)
  callback: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000,
  },

  // API endpoints - moderate (100 per minute)
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000,
  },

  // Authenticated API endpoints - lenient (200 per minute)
  apiAuthenticated: {
    maxRequests: 200,
    windowMs: 60 * 1000,
  },

  // Webhooks - very lenient (1000 per minute for Shopify bursts)
  webhooks: {
    maxRequests: 1000,
    windowMs: 60 * 1000,
  },

  // Public endpoints - strict (20 per minute)
  public: {
    maxRequests: 20,
    windowMs: 60 * 1000,
  },

  // Health check - moderate (10 per minute)
  health: {
    maxRequests: 10,
    windowMs: 60 * 1000,
  },
};
