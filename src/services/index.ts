
// Core utilities
export { invokeEdgeFunction, invokeEdgeFunctionsBatch } from '@/utils/edgeFunctionHelper';

// Domain Services (Class-based)
export { AuthService } from './authService';
export { MerchantService } from './merchantService';
export { AnalyticsService } from './analyticsService';
export { AIService, aiService } from './aiService';
export { StripeService, stripeService } from './stripeService';
export { N8nService, n8nService } from './n8nService';
export { ReturnService } from './returnService';
export { MerchantReturnsService } from './merchantReturnsService';
export { NotificationService } from './notificationService';
export { OrderService } from './orderService';

// Gateway Service
export { ApiService, apiService } from './apiService';

// Service Registry for dependency injection and testing
export const services = {
  // Core gateway
  api: apiService,
  
  // Domain services
  auth: AuthService,
  merchant: MerchantService,
  analytics: AnalyticsService,
  ai: aiService,
  stripe: stripeService,
  n8n: n8nService,
  returns: ReturnService,
  merchantReturns: MerchantReturnsService,
  notifications: NotificationService,
  orders: OrderService
};

export type ServiceRegistry = typeof services;

// Re-export types for convenience
export type { 
  EdgeFunctionResponse 
} from '@/utils/edgeFunctionHelper';
