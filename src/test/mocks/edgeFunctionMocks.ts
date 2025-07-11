
import { vi } from 'vitest';

export const mockEdgeFunctionResponses = {
  'generate-exchange-recommendation': {
    success: true,
    data: {
      suggestedProduct: 'Premium Test Product',
      confidence: 88,
      reasoning: 'AI analysis suggests this upgrade based on return reason',
      alternativeProducts: ['Standard Product', 'Deluxe Product']
    }
  },
  'generate-advanced-recommendation': {
    success: true,
    data: {
      type: 'exchange',
      suggestedProduct: 'Enhanced Product',
      confidence: 90,
      reasoning: 'Advanced AI recommendation',
      expectedOutcome: 'Higher customer satisfaction',
      alternativeOptions: ['Refund', 'Store credit'],
      customerRetentionScore: 85
    }
  },
  'analyze-return-risk': {
    success: true,
    data: {
      riskLevel: 'low',
      fraudProbability: 0.1,
      customerSatisfactionScore: 85,
      recommendedAction: 'approve',
      reasoning: 'Customer has good history'
    }
  },
  'send-notification-email': {
    success: true,
    data: {
      emailId: 'email-123',
      status: 'sent'
    }
  },
  'create-checkout': {
    success: true,
    data: {
      url: 'https://checkout.stripe.com/pay/test-session'
    }
  },
  'shopify-connection-test': {
    success: true,
    data: {
      connected: true,
      shopName: 'Test Store'
    }
  }
};

export const createMockEdgeFunction = (functionName: string, customResponse?: any) => {
  return vi.fn().mockResolvedValue(
    customResponse || mockEdgeFunctionResponses[functionName as keyof typeof mockEdgeFunctionResponses] || {
      success: false,
      error: 'Mock function not configured'
    }
  );
};

// Helper to simulate edge function failures
export const createFailingMockEdgeFunction = (errorMessage: string = 'Mock error') => {
  return vi.fn().mockResolvedValue({
    success: false,
    error: errorMessage
  });
};

// Helper to simulate network errors
export const createNetworkErrorMockEdgeFunction = () => {
  return vi.fn().mockRejectedValue(new Error('Network error'));
};
