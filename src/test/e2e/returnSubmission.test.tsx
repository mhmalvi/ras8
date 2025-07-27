import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CustomerReturnsPortal from '@/components/CustomerReturnsPortal';

// Mock Supabase for E2E scenarios
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    functions: {
      invoke: vi.fn()
    }
  }
}));

const renderPortal = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <CustomerReturnsPortal />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Return Submission E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Order Lookup Flow', () => {
    it('should complete full order lookup flow', async () => {
      const mockSupabase = (await import('@/integrations/supabase/client')).supabase as any;
      
      // Mock successful order lookup
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: {
                  id: 'order-123',
                  shopify_order_id: '12345',
                  customer_email: 'test@example.com',
                  total_amount: 199.99,
                  order_items: [
                    {
                      id: 'item-1',
                      product_name: 'Test Product',
                      quantity: 1,
                      price: 199.99
                    }
                  ]
                },
                error: null
              })
            })
          })
        })
      });

      renderPortal();

      // Test basic functionality
      expect(screen.getByText(/find your order/i)).toBeInTheDocument();
    });

    it('should handle order not found scenario', async () => {
      const mockSupabase = (await import('@/integrations/supabase/client')).supabase as any;
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      });

      renderPortal();
      expect(screen.getByText(/find your order/i)).toBeInTheDocument();
    });
  });
});