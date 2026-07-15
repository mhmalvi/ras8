import crypto from 'crypto';
import type { VercelRequest } from '@vercel/node';
import { ForbiddenError, BadRequestError } from './errorHandler.js';

/**
 * Validate Shopify OAuth callback HMAC
 */
export function validateOAuthHmac(
  query: Record<string, any>,
  secret: string
): boolean {
  const { hmac, signature, ...rest } = query;

  if (!hmac) {
    return false;
  }

  // Build query string for validation (excluding hmac)
  const sortedParams = Object.keys(rest)
    .sort()
    .map((key) => `${key}=${rest[key]}`)
    .join('&');

  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(sortedParams)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(calculatedHmac, 'hex')
  );
}

/**
 * Validate Shopify webhook HMAC
 */
export function validateWebhookHmac(
  rawBody: string | Buffer,
  signature: string | undefined,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const hmac = signature.replace('sha256=', '');
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(calculatedHmac, 'hex')
    );
  } catch (error) {
    // timingSafeEqual throws if buffers are different lengths
    return false;
  }
}

/**
 * Middleware to validate OAuth HMAC
 */
export function requireOAuthHmac(secret?: string) {
  return (req: VercelRequest): void => {
    const clientSecret = secret || process.env.SHOPIFY_CLIENT_SECRET;

    if (!clientSecret) {
      throw new Error('SHOPIFY_CLIENT_SECRET not configured');
    }

    const isValid = validateOAuthHmac(req.query, clientSecret);

    if (!isValid) {
      throw new ForbiddenError('Invalid HMAC signature');
    }
  };
}

/**
 * Middleware to validate webhook HMAC
 */
export function requireWebhookHmac(secret?: string) {
  return (req: VercelRequest): void => {
    const webhookSecret = secret ||
                          process.env.SHOPIFY_WEBHOOK_SECRET ||
                          process.env.SHOPIFY_CLIENT_SECRET;

    if (!webhookSecret) {
      throw new Error('SHOPIFY_WEBHOOK_SECRET not configured');
    }

    const signature = req.headers['x-shopify-hmac-sha256'] as string;
    const rawBody = JSON.stringify(req.body);

    const isValid = validateWebhookHmac(rawBody, signature, webhookSecret);

    if (!isValid) {
      throw new ForbiddenError('Invalid webhook signature');
    }
  };
}

/**
 * Validate shop domain format
 */
export function validateShopDomain(shop: string | undefined): string {
  if (!shop) {
    throw new BadRequestError('Missing shop parameter');
  }

  // Ensure .myshopify.com domain
  if (!shop.endsWith('.myshopify.com')) {
    throw new BadRequestError('Invalid shop domain format');
  }

  // Basic validation to prevent injection
  if (!/^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(shop)) {
    throw new BadRequestError('Invalid shop domain characters');
  }

  return shop;
}

/**
 * Extract and validate shop domain from various sources
 */
export function extractShopDomain(req: VercelRequest): string {
  const shop =
    (req.query.shop as string) ||
    (req.headers['x-shopify-shop-domain'] as string) ||
    req.body?.shop_domain ||
    req.body?.myshopify_domain;

  return validateShopDomain(shop);
}

/**
 * Generate HMAC for outgoing requests (if needed)
 */
export function generateHmac(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Validate request timestamp to prevent replay attacks
 */
export function validateTimestamp(
  timestamp: number | string,
  maxAgeMs: number = 5 * 60 * 1000 // 5 minutes default
): boolean {
  const requestTime = typeof timestamp === 'string' ? parseInt(timestamp, 10) : timestamp;
  const now = Date.now();
  const age = now - requestTime;

  return age >= 0 && age <= maxAgeMs;
}
