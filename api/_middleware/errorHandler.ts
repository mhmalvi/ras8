import type { VercelRequest, VercelResponse } from '@vercel/node';
import { logger } from './logger';
import { captureException, setContext, setTag } from './sentry';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
  details?: any;
  requestId?: string;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  statusCode: number;
  details?: any;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Operational errors are expected (like validation errors)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common API error types
 */
export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad Request', details?: any) {
    super(message, 400, details);
    this.name = 'BadRequestError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, details);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Not Found', details?: any) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Conflict', details?: any) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string = 'Validation Error', details?: any) {
    super(message, 422, details);
    this.name = 'ValidationError';
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal Server Error', details?: any) {
    super(message, 500, details);
    this.name = 'InternalServerError';
  }
}

/**
 * Format error response
 */
export function formatErrorResponse(
  error: Error | ApiError,
  req: VercelRequest
): ErrorResponse {
  const isApiError = error instanceof ApiError;
  const statusCode = isApiError ? error.statusCode : 500;

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development' ||
                       process.env.VITE_DEV_MODE === 'true';

  const response: ErrorResponse = {
    error: error.name || 'Error',
    message: error.message || 'An unexpected error occurred',
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
  };

  // Include details in development or for operational errors
  if (isDevelopment || (isApiError && error.isOperational)) {
    if (isApiError && error.details) {
      response.details = error.details;
    }
  }

  // Add stack trace in development
  if (isDevelopment) {
    (response as any).stack = error.stack;
  }

  return response;
}

/**
 * Error handling middleware wrapper
 */
export function withErrorHandler(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<any> | any
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      return await handler(req, res);
    } catch (error) {
      // Use structured logging
      logger.error('API Error', {
        path: req.url,
        method: req.method,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        statusCode: error instanceof ApiError ? error.statusCode : 500,
      });

      const errorResponse = formatErrorResponse(error as Error, req);

      // Capture to Sentry with context
      if (error instanceof ApiError) {
        // Set context for operational errors
        setContext('request', {
          path: req.url,
          method: req.method,
          query: req.query,
          headers: {
            'user-agent': req.headers['user-agent'],
            'x-forwarded-for': req.headers['x-forwarded-for'],
          },
        });

        setTag('error.type', error.name);
        setTag('error.operational', 'true');
        setTag('http.status_code', error.statusCode.toString());

        captureException(error, {
          statusCode: error.statusCode,
          details: error.details,
          isOperational: error.isOperational,
        });
      } else {
        // Capture unexpected errors
        setContext('request', {
          path: req.url,
          method: req.method,
          query: req.query,
        });

        setTag('error.type', 'UnexpectedError');
        setTag('error.operational', 'false');

        captureException(error as Error, {
          message: (error as Error).message,
          stack: (error as Error).stack,
        });
      }

      return res.status(errorResponse.statusCode).json(errorResponse);
    }
  };
}

/**
 * Async handler wrapper (prevents forgotten await)
 */
export function asyncHandler(
  fn: (req: VercelRequest, res: VercelResponse) => Promise<any>
) {
  return (req: VercelRequest, res: VercelResponse) => {
    return Promise.resolve(fn(req, res)).catch((error) => {
      const errorResponse = formatErrorResponse(error, req);
      return res.status(errorResponse.statusCode).json(errorResponse);
    });
  };
}

/**
 * Validate required environment variables
 */
export function validateEnv(required: string[]): void {
  const missing: string[] = [];

  required.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Validate required request parameters
 */
export function validateParams(
  params: Record<string, any>,
  required: string[]
): void {
  const missing: string[] = [];

  required.forEach((key) => {
    if (params[key] === undefined || params[key] === null || params[key] === '') {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new BadRequestError(
      'Missing required parameters',
      { missingParams: missing }
    );
  }
}

/**
 * Handle Supabase errors
 */
export function handleSupabaseError(error: any): never {
  if (error.code === '23505') {
    throw new ConflictError('Record already exists', { code: error.code });
  }

  if (error.code === '23503') {
    throw new BadRequestError('Referenced record not found', { code: error.code });
  }

  if (error.code === 'PGRST116') {
    throw new NotFoundError('Record not found', { code: error.code });
  }

  // Generic database error
  throw new InternalServerError('Database error', {
    code: error.code,
    message: error.message,
  });
}

/**
 * Combine rate limiting and error handling
 */
export function withMiddleware(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<any> | any,
  options?: {
    rateLimit?: { maxRequests: number; windowMs: number };
  }
) {
  let wrappedHandler = withErrorHandler(handler);

  if (options?.rateLimit) {
    const { withRateLimit } = require('./rateLimit');
    wrappedHandler = withRateLimit(options.rateLimit, wrappedHandler);
  }

  return wrappedHandler;
}
