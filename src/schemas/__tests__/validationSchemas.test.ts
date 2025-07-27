import { describe, it, expect } from 'vitest';
import { validateRequest, signUpSchema, signInSchema, createReturnSchema } from '@/schemas/validationSchemas';

describe('Validation Schemas', () => {
  describe('signUpSchema validation', () => {
    it('should validate correct sign up data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = validateRequest(signUpSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = validateRequest(signUpSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('signInSchema validation', () => {
    it('should validate correct sign in data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      const result = validateRequest(signInSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'SecurePass123!'
      };

      const result = validateRequest(signInSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('createReturnSchema validation', () => {
    it('should validate correct return data', () => {
      const validData = {
        shopify_order_id: '12345',
        customer_email: 'test@example.com',
        reason: 'Size too small',
        total_amount: 99.99
      };

      const result = validateRequest(createReturnSchema, validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid data', () => {
      const invalidData = {
        shopify_order_id: '',
        customer_email: 'invalid-email',
        reason: '',
        total_amount: -10
      };

      const result = validateRequest(createReturnSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });
});