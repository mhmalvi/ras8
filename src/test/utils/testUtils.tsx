import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';

// Create a custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock data generators
export const mockMerchant = {
  id: 'test-merchant-id',
  shop_domain: 'test-shop.myshopify.com',
  plan_type: 'starter',
  settings: {},
  created_at: new Date().toISOString()
};

export const mockReturn = {
  id: 'test-return-id',
  merchant_id: 'test-merchant-id',
  shopify_order_id: '12345',
  customer_email: 'test@example.com',
  status: 'requested',
  reason: 'Size too small',
  total_amount: 99.99,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  return_items: [
    {
      id: 'item-1',
      action: 'refund',
      quantity: 1
    }
  ]
};

export const mockAnalyticsEvent = {
  id: 'event-1',
  merchant_id: 'test-merchant-id',
  event_type: 'return_submitted',
  event_data: { amount: 99.99 },
  created_at: new Date().toISOString()
};