import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import type { VercelRequest } from '@vercel/node';

/**
 * Log levels (RFC 5424)
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly',
}

/**
 * Determine log level based on environment
 */
const getLogLevel = (): string => {
  const env = process.env.NODE_ENV || 'development';

  if (env === 'production') return 'info';
  if (env === 'test') return 'error';
  return 'debug';
};

/**
 * Custom format for console output with colors
 */
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present
    if (Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  })
);

/**
 * JSON format for file output
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create Winston logger instance
 */
const createLogger = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development' ||
                       process.env.VITE_DEV_MODE === 'true';

  // Transports array
  const transports: winston.transport[] = [];

  // Console transport (always enabled in development)
  if (isDevelopment || !isProduction) {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
      })
    );
  }

  // File transports (production only, or if ENABLE_FILE_LOGS is set).
  // Never on Vercel: its filesystem is read-only, so file logging crashes
  // every function at boot — console transport goes to Vercel's log drain.
  if (!process.env.VERCEL && (isProduction || process.env.ENABLE_FILE_LOGS === 'true')) {
    // Error logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
      })
    );

    // Combined logs
    transports.push(
      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: fileFormat,
      })
    );

    // HTTP logs (API requests)
    transports.push(
      new DailyRotateFile({
        filename: 'logs/http-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        level: 'http',
        maxSize: '20m',
        maxFiles: '7d',
        format: fileFormat,
      })
    );
  }

  return winston.createLogger({
    level: getLogLevel(),
    transports,
    // Don't exit on handled exceptions
    exitOnError: false,
  });
};

// Create singleton logger instance
export const logger = createLogger();

/**
 * Request logging metadata
 */
export interface RequestLogMetadata {
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  statusCode?: number;
  responseTime?: number;
  userId?: string;
  shopDomain?: string;
  requestId?: string;
  [key: string]: any;
}

/**
 * Extract request metadata for logging
 */
export function extractRequestMetadata(req: VercelRequest): RequestLogMetadata {
  return {
    method: req.method,
    url: req.url,
    ip: (req.headers['x-forwarded-for'] as string) ||
        (req.headers['x-real-ip'] as string) ||
        'unknown',
    userAgent: req.headers['user-agent'] as string,
    shopDomain: (req.headers['x-shopify-shop-domain'] as string) ||
                (req.query.shop as string),
  };
}

/**
 * Log HTTP request
 */
export function logRequest(
  req: VercelRequest,
  metadata?: Partial<RequestLogMetadata>
): void {
  const requestMetadata = {
    ...extractRequestMetadata(req),
    ...metadata,
  };

  logger.http('HTTP Request', requestMetadata);
}

/**
 * Log HTTP response
 */
export function logResponse(
  req: VercelRequest,
  statusCode: number,
  responseTime: number,
  metadata?: Partial<RequestLogMetadata>
): void {
  const requestMetadata = {
    ...extractRequestMetadata(req),
    statusCode,
    responseTime,
    ...metadata,
  };

  const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
  logger.log(level, 'HTTP Response', requestMetadata);
}

/**
 * Log authentication events
 */
export const authLogger = {
  signUpAttempt: (email: string, metadata?: object) => {
    logger.info('Sign up attempt', { email, ...metadata });
  },

  signUpSuccess: (userId: string, email: string, metadata?: object) => {
    logger.info('Sign up successful', { userId, email, ...metadata });
  },

  signUpFailure: (email: string, error: string, metadata?: object) => {
    logger.warn('Sign up failed', { email, error, ...metadata });
  },

  signInAttempt: (email: string, metadata?: object) => {
    logger.info('Sign in attempt', { email, ...metadata });
  },

  signInSuccess: (userId: string, email: string, metadata?: object) => {
    logger.info('Sign in successful', { userId, email, ...metadata });
  },

  signInFailure: (email: string, error: string, metadata?: object) => {
    logger.warn('Sign in failed', { email, error, ...metadata });
  },

  signOut: (userId: string, metadata?: object) => {
    logger.info('User signed out', { userId, ...metadata });
  },

  tokenRefresh: (userId: string, metadata?: object) => {
    logger.debug('Token refreshed', { userId, ...metadata });
  },

  oauthStart: (shop: string, metadata?: object) => {
    logger.info('OAuth flow started', { shop, ...metadata });
  },

  oauthCallback: (shop: string, success: boolean, metadata?: object) => {
    logger.info('OAuth callback received', { shop, success, ...metadata });
  },
};

/**
 * Log database operations
 */
export const dbLogger = {
  query: (operation: string, table: string, metadata?: object) => {
    logger.debug('Database query', { operation, table, ...metadata });
  },

  querySuccess: (operation: string, table: string, rowCount?: number, metadata?: object) => {
    logger.debug('Database query successful', {
      operation,
      table,
      rowCount,
      ...metadata
    });
  },

  queryError: (operation: string, table: string, error: string, metadata?: object) => {
    logger.error('Database query failed', {
      operation,
      table,
      error,
      ...metadata
    });
  },

  migration: (version: string, status: string, metadata?: object) => {
    logger.info('Database migration', { version, status, ...metadata });
  },
};

/**
 * Log webhook events
 */
export const webhookLogger = {
  received: (eventType: string, shop: string, metadata?: object) => {
    logger.info('Webhook received', { eventType, shop, ...metadata });
  },

  processed: (eventType: string, shop: string, metadata?: object) => {
    logger.info('Webhook processed', { eventType, shop, ...metadata });
  },

  failed: (eventType: string, shop: string, error: string, metadata?: object) => {
    logger.error('Webhook processing failed', {
      eventType,
      shop,
      error,
      ...metadata
    });
  },

  hmacValid: (shop: string, metadata?: object) => {
    logger.debug('Webhook HMAC valid', { shop, ...metadata });
  },

  hmacInvalid: (shop: string, metadata?: object) => {
    logger.warn('Webhook HMAC invalid', { shop, ...metadata });
  },
};

/**
 * Log business events
 */
export const businessLogger = {
  appInstalled: (merchantId: string, shop: string, metadata?: object) => {
    logger.info('App installed', { merchantId, shop, ...metadata });
  },

  appUninstalled: (merchantId: string, shop: string, metadata?: object) => {
    logger.info('App uninstalled', { merchantId, shop, ...metadata });
  },

  returnCreated: (returnId: string, merchantId: string, metadata?: object) => {
    logger.info('Return created', { returnId, merchantId, ...metadata });
  },

  returnProcessed: (returnId: string, status: string, metadata?: object) => {
    logger.info('Return processed', { returnId, status, ...metadata });
  },

  paymentProcessed: (amount: number, merchantId: string, metadata?: object) => {
    logger.info('Payment processed', { amount, merchantId, ...metadata });
  },
};

/**
 * Log security events
 */
export const securityLogger = {
  rateLimitExceeded: (ip: string, endpoint: string, metadata?: object) => {
    logger.warn('Rate limit exceeded', { ip, endpoint, ...metadata });
  },

  hmacValidationFailed: (endpoint: string, metadata?: object) => {
    logger.warn('HMAC validation failed', { endpoint, ...metadata });
  },

  unauthorizedAccess: (ip: string, endpoint: string, metadata?: object) => {
    logger.warn('Unauthorized access attempt', { ip, endpoint, ...metadata });
  },

  suspiciousActivity: (description: string, metadata?: object) => {
    logger.warn('Suspicious activity detected', { description, ...metadata });
  },
};

/**
 * Middleware to log all requests/responses
 */
export function withRequestLogging(
  handler: (req: VercelRequest, res: any) => Promise<any> | any
) {
  return async (req: VercelRequest, res: any) => {
    const startTime = Date.now();

    // Log incoming request
    logRequest(req);

    // Intercept response to log it
    const originalJson = res.json;
    const originalSend = res.send;
    const originalStatus = res.status;

    let statusCode = 200;

    res.status = function (code: number) {
      statusCode = code;
      return originalStatus.call(this, code);
    };

    const logAndRespond = (data: any) => {
      const responseTime = Date.now() - startTime;
      logResponse(req, statusCode, responseTime);
      return data;
    };

    res.json = function (data: any) {
      logAndRespond(data);
      return originalJson.call(this, data);
    };

    res.send = function (data: any) {
      logAndRespond(data);
      return originalSend.call(this, data);
    };

    return handler(req, res);
  };
}

/**
 * Export logger as default
 */
export default logger;
