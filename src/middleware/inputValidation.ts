import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Common validation schemas
export const ValidationSchemas = {
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  uuid: z.string().uuid('Invalid UUID format'),
  shopifyOrderId: z.string().regex(/^\d+$/, 'Invalid Shopify order ID'),
  amount: z.number().positive('Amount must be positive'),
  status: z.enum(['requested', 'approved', 'in_transit', 'completed', 'rejected']),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason too long'),
  merchantId: z.string().uuid('Invalid merchant ID'),
  returnId: z.string().uuid('Invalid return ID'),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  aiConfidence: z.number().min(0).max(1, 'Confidence must be between 0 and 1'),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20)
  }),
  dateRange: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional()
  })
};

// Request validation schemas
export const RequestSchemas = {
  createReturn: z.object({
    shopify_order_id: ValidationSchemas.shopifyOrderId,
    customer_email: ValidationSchemas.email,
    reason: ValidationSchemas.reason,
    total_amount: ValidationSchemas.amount,
    merchant_id: ValidationSchemas.merchantId,
    items: z.array(z.object({
      product_id: ValidationSchemas.productId,
      product_name: z.string().min(1, 'Product name is required'),
      quantity: ValidationSchemas.quantity,
      price: ValidationSchemas.amount,
      action: z.enum(['refund', 'exchange', 'store_credit']).default('refund')
    })).min(1, 'At least one item is required')
  }),

  updateReturn: z.object({
    id: ValidationSchemas.returnId,
    status: ValidationSchemas.status.optional(),
    reason: ValidationSchemas.reason.optional()
  }),

  createAISuggestion: z.object({
    return_id: ValidationSchemas.returnId,
    suggestion_type: z.enum(['exchange', 'refund', 'store_credit']),
    suggested_product_id: ValidationSchemas.productId.optional(),
    suggested_product_name: z.string().optional(),
    reasoning: z.string().min(10, 'Reasoning must be at least 10 characters'),
    confidence_score: ValidationSchemas.aiConfidence
  }),

  getReturns: z.object({
    merchant_id: ValidationSchemas.merchantId.optional(),
    status: ValidationSchemas.status.optional(),
    customer_email: ValidationSchemas.email.optional(),
    pagination: ValidationSchemas.pagination.optional(),
    date_range: ValidationSchemas.dateRange.optional()
  }),

  bulkUpdateReturns: z.object({
    return_ids: z.array(ValidationSchemas.returnId).min(1, 'At least one return ID required'),
    updates: z.object({
      status: ValidationSchemas.status.optional(),
      reason: ValidationSchemas.reason.optional()
    })
  }),

  customerPortalLookup: z.object({
    order_id: ValidationSchemas.shopifyOrderId,
    email: ValidationSchemas.email
  }),

  webhookPayload: z.object({
    shopify_order_id: ValidationSchemas.shopifyOrderId,
    event_type: z.string().min(1),
    data: z.record(z.string(), z.any())
  })
};

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

class InputValidator {
  private sanitizeString(input: string): string {
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
    try {
      // First sanitize the data
      const sanitizedData = this.sanitizeObject(data);
      
      // Then validate with schema
      const result = schema.parse(sanitizedData);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: ValidationError[] = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        return {
          success: false,
          errors
        };
      }
      
      return {
        success: false,
        errors: [{
          field: 'unknown',
          message: 'Validation failed',
          code: 'UNKNOWN_ERROR'
        }]
      };
    }
  }

  async validateWithDatabase<T>(
    schema: z.ZodSchema<T>, 
    data: unknown,
    additionalChecks?: {
      checkMerchantExists?: boolean;
      checkReturnExists?: boolean;
      merchantId?: string;
      returnId?: string;
    }
  ): Promise<ValidationResult<T>> {
    // First validate the schema
    const schemaResult = this.validate(schema, data);
    if (!schemaResult.success) {
      return schemaResult;
    }

    // Perform additional database checks if specified
    if (additionalChecks) {
      try {
        if (additionalChecks.checkMerchantExists && additionalChecks.merchantId) {
          const { data: merchant } = await supabase
            .from('merchants')
            .select('id')
            .eq('id', additionalChecks.merchantId)
            .single();
          
          if (!merchant) {
            return {
              success: false,
              errors: [{
                field: 'merchant_id',
                message: 'Merchant not found',
                code: 'NOT_FOUND'
              }]
            };
          }
        }

        if (additionalChecks.checkReturnExists && additionalChecks.returnId) {
          const { data: returnRecord } = await supabase
            .from('returns')
            .select('id')
            .eq('id', additionalChecks.returnId)
            .single();
          
          if (!returnRecord) {
            return {
              success: false,
              errors: [{
                field: 'return_id',
                message: 'Return not found',
                code: 'NOT_FOUND'
              }]
            };
          }
        }
      } catch (error) {
        console.error('Database validation error:', error);
        return {
          success: false,
          errors: [{
            field: 'database',
            message: 'Database validation failed',
            code: 'DATABASE_ERROR'
          }]
        };
      }
    }

    return schemaResult;
  }

  // Middleware function for request validation
  middleware<T>(schema: z.ZodSchema<T>) {
    return async (request: Request, response: any, next: () => void) => {
      try {
        let data: unknown;
        
        // Parse request body based on content type
        const contentType = request.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          data = await request.json();
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          const formData = await request.formData();
          data = Object.fromEntries(formData.entries());
        } else {
          // For GET requests, use URL search params
          const url = new URL(request.url);
          data = Object.fromEntries(url.searchParams.entries());
        }

        const result = this.validate(schema, data);
        
        if (!result.success) {
          return new Response(
            JSON.stringify({
              error: 'Validation failed',
              details: result.errors
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // Attach validated data to request
        (request as any).validatedData = result.data;
        
        return next();
      } catch (error) {
        console.error('Validation middleware error:', error);
        return new Response(
          JSON.stringify({
            error: 'Invalid request format'
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    };
  }

  // Rate limiting based on validation errors
  async logValidationFailure(
    ip: string, 
    errors: ValidationError[], 
    endpoint: string
  ): Promise<void> {
    try {
      await supabase.from('analytics_events').insert({
        event_type: 'validation_failure',
        event_data: {
          ip,
          errors: errors.map(e => ({ field: e.field, message: e.message, code: e.code })),
          endpoint,
          timestamp: new Date().toISOString()
        } as any
      });
    } catch (error) {
      console.error('Failed to log validation failure:', error);
    }
  }

  // Batch validation for multiple items
  validateBatch<T>(
    schema: z.ZodSchema<T>, 
    items: unknown[]
  ): Array<ValidationResult<T>> {
    return items.map(item => this.validate(schema, item));
  }

  // Custom validation rules
  customValidations = {
    isStrongPassword: (password: string): boolean => {
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      
      return hasLower && hasUpper && hasNumber && hasSpecial;
    },

    isSafeHTML: (html: string): boolean => {
      // Basic check for potentially dangerous HTML
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i
      ];
      
      return !dangerousPatterns.some(pattern => pattern.test(html));
    },

    isValidShopifyDomain: (domain: string): boolean => {
      return /^[a-zA-Z0-9][a-zA-Z0-9\-]{1,61}[a-zA-Z0-9]\.myshopify\.com$/.test(domain);
    }
  };
}

export const inputValidator = new InputValidator();

// Utility functions for common validations
export const validateEmail = (email: string) => 
  inputValidator.validate(ValidationSchemas.email, email);

export const validatePassword = (password: string) => 
  inputValidator.validate(ValidationSchemas.password, password);

export const validateUUID = (uuid: string) => 
  inputValidator.validate(ValidationSchemas.uuid, uuid);

// Export for edge functions
export { InputValidator };