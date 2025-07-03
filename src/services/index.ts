
export { aiService, AIService } from './aiService';
export { n8nService, N8nService } from './n8nService';
export { stripeService, StripeService } from './stripeService';
export { apiService, ApiService } from './apiService';

// Service registry for dependency injection and testing
export const services = {
  ai: aiService,
  n8n: n8nService,
  stripe: stripeService,
  api: apiService
};

export type ServiceRegistry = typeof services;
