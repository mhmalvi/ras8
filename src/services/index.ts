
// Core utilities
export { invokeEdgeFunction, invokeEdgeFunctionsBatch } from '@/utils/edgeFunctionHelper';

// Import all services
import { AuthService } from './authService';
import { MerchantService } from './merchantService';
import { AnalyticsService } from './analyticsService';
import { AIService, aiService } from './aiService';
import { StripeService, stripeService } from './stripeService';
import { N8nService, n8nService } from './n8nService';
import { ReturnService } from './returnService';
import { MerchantReturnsService } from './merchantReturnsService';
import { NotificationService } from './notificationService';
import { OrderService } from './orderService';
import { ApiService } from './apiService';

// Create apiService instance
const apiService = new ApiService();

// Domain Services (Class-based) - Export classes
export { AuthService };
export { MerchantService };
export { AnalyticsService };
export { AIService, aiService };
export { StripeService, stripeService };
export { N8nService, n8nService };
export { ReturnService };
export { MerchantReturnsService };
export { NotificationService };
export { OrderService };

// Gateway Service - Export class and instance
export { ApiService, apiService };

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
