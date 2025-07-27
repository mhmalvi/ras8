import { z } from 'zod';

// ================================
// CORE VALIDATION SCHEMAS
// ================================

export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const uuidSchema = z.string().uuid('Invalid UUID format');

// ================================
// AUTH SCHEMAS
// ================================

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional()
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

// ================================
// RETURNS SCHEMAS
// ================================

export const createReturnSchema = z.object({
  shopify_order_id: z.string().min(1, 'Order ID is required'),
  customer_email: emailSchema,
  reason: z.string().min(1, 'Return reason is required').max(500, 'Reason too long'),
  total_amount: z.number().min(0, 'Amount must be positive'),
  merchant_id: uuidSchema.optional()
});

export const updateReturnSchema = z.object({
  status: z.enum(['requested', 'approved', 'rejected', 'in_transit', 'completed']),
  reason: z.string().max(500, 'Reason too long').optional()
});

export const returnItemSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  product_name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be positive'),
  action: z.enum(['refund', 'exchange', 'store_credit']).default('refund')
});

// ================================
// SHOPIFY SCHEMAS
// ================================

export const shopifyOrderLookupSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  customerEmail: emailSchema,
  shopDomain: z.string().optional(),
  accessToken: z.string().optional()
});

export const shopifyWebhookSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().optional(),
  total_price: z.string().optional(),
  line_items: z.array(z.object({
    id: z.number().int(),
    product_id: z.number().int(),
    name: z.string(),
    quantity: z.number().int().min(1),
    price: z.string()
  })).optional(),
  customer: z.object({
    email: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional()
  }).optional()
});

// ================================
// AI SCHEMAS
// ================================

export const aiRecommendationSchema = z.object({
  returnReason: z.string().min(1, 'Return reason is required'),
  productName: z.string().min(1, 'Product name is required'), 
  customerEmail: emailSchema,
  orderValue: z.number().min(0, 'Order value must be positive')
});

export const aiSuggestionSchema = z.object({
  return_id: uuidSchema,
  suggestion_type: z.enum(['exchange', 'upgrade', 'refund', 'store_credit']),
  suggested_product_id: z.string().optional(),
  suggested_product_name: z.string().optional(),
  reasoning: z.string().min(1, 'Reasoning is required'),
  confidence_score: z.number().min(0).max(1, 'Confidence score must be between 0 and 1')
});

// ================================
// MERCHANT SCHEMAS  
// ================================

export const merchantSchema = z.object({
  shop_domain: z.string().min(1, 'Shop domain is required'),
  access_token: z.string().min(1, 'Access token is required'),
  plan_type: z.enum(['starter', 'growth', 'pro']).default('starter'),
  settings: z.record(z.string(), z.any()).optional()
});

export const webhookActivitySchema = z.object({
  merchant_id: uuidSchema,
  webhook_type: z.string().min(1, 'Webhook type is required'),
  source: z.string().min(1, 'Source is required'),
  payload: z.record(z.string(), z.any()),
  status: z.enum(['received', 'processing', 'completed', 'failed']).default('received')
});

// ================================
// VALIDATION HELPERS
// ================================

export const validateRequest = <T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
};

export const sanitizeString = (input: string, maxLength: number = 1000): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
    .substring(0, maxLength);
};

export const sanitizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
};

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type CreateReturnInput = z.infer<typeof createReturnSchema>;
export type UpdateReturnInput = z.infer<typeof updateReturnSchema>;
export type ReturnItemInput = z.infer<typeof returnItemSchema>;
export type ShopifyOrderLookupInput = z.infer<typeof shopifyOrderLookupSchema>;
export type AIRecommendationInput = z.infer<typeof aiRecommendationSchema>;
export type MerchantInput = z.infer<typeof merchantSchema>;