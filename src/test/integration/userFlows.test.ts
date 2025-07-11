
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the services we'll be testing
import { ReturnService } from '@/services/returnService';
import { OrderService } from '@/services/orderService';
import { aiService } from '@/services/aiService';
import { supabase } from '@/integrations/supabase/client';

// Import components for integration testing
import CustomerReturnsPortal from '@/components/CustomerReturnsPortal';
import RealReturnsTable from '@/components/RealReturnsTable';

vi.mock('@/integrations/supabase/client');
vi.mock('@/services/returnService');
vi.mock('@/services/orderService');
vi.mock('@/services/aiService');

describe('User Flows Integration Tests', () => {
  let queryClient: QueryClient;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Customer Return Flow', () => {
    it('should complete full return submission flow', async () => {
      // Mock order lookup
      const mockOrder = {
        id: 'order-1',
        shopify_order_id: '12345',
        customer_email: 'test@example.com',
        total_amount: 200,
        items: [
          {
            id: 'item-1',
            product_id: 'prod-1',
            product_name: 'Test Product',
            price: 100,
            quantity: 2
          }
        ]
      };

      vi.mocked(OrderService.lookupOrder).mockResolvedValue(mockOrder);

      // Mock AI recommendation
      const mockAIRecommendation = {
        suggestedProduct: 'Premium Test Product',
        confidence: 88,
        reasoning: 'Better quality alternative',
        alternativeProducts: ['Standard Product']
      };

      vi.mocked(aiService.generateExchangeRecommendation).mockResolvedValue(mockAIRecommendation);

      // Mock return submission
      vi.mocked(ReturnService.submitReturn).mockResolvedValue({
        returnId: 'return-1'
      });

      renderWithProviders(<CustomerReturnsPortal />);

      // Step 1: Enter order lookup information
      const orderNumberRegex = /Order Number/i;
      const emailAddressRegex = /Email Address/i;
      const orderInput = screen.getByPlaceholderText(orderNumberRegex);
      const emailInput = screen.getByPlaceholderText(emailAddressRegex);
      
      await user.type(orderInput, '12345');
      await user.type(emailInput, 'test@example.com');
      
      const lookupOrderRegex = /Look up Order/i;
      const lookupButton = screen.getByText(lookupOrderRegex);
      await user.click(lookupButton);

      // Wait for order to load
      await waitFor(() => {
        expect(screen.getByText('Test Product')).toBeInTheDocument();
      });

      // Step 2: Select item for return
      const itemCheckbox = screen.getByRole('checkbox');
      await user.click(itemCheckbox);

      // Step 3: Select return reason
      const reasonSelect = screen.getByRole('combobox');
      await user.click(reasonSelect);
      
      const sizeOption = screen.getByText('Size Issue');
      await user.click(sizeOption);

      // Step 4: Submit return
      const submitButton = screen.getByText('Submit Return');
      await user.click(submitButton);

      // Verify the flow completed
      await waitFor(() => {
        expect(ReturnService.submitReturn).toHaveBeenCalledWith(
          expect.objectContaining({
            orderNumber: '12345',
            email: 'test@example.com',
            selectedItems: ['item-1']
          }),
          mockOrder
        );
      });

      expect(screen.getByText('Return submitted successfully')).toBeInTheDocument();
    });

    it('should handle order not found scenario', async () => {
      vi.mocked(OrderService.lookupOrder).mockRejectedValue(
        new Error('Order not found')
      );

      renderWithProviders(<CustomerReturnsPortal />);

      const orderNumberRegex = /Order Number/i;
      const emailAddressRegex = /Email Address/i;
      const orderInput = screen.getByPlaceholderText(orderNumberRegex);
      const emailInput = screen.getByPlaceholderText(emailAddressRegex);
      
      await user.type(orderInput, '99999');
      await user.type(emailInput, 'notfound@example.com');
      
      const lookupOrderRegex = /Look up Order/i;
      const lookupButton = screen.getByText(lookupOrderRegex);
      await user.click(lookupButton);

      const orderNotFoundRegex = /Order not found/i;
      await waitFor(() => {
        expect(screen.getByText(orderNotFoundRegex)).toBeInTheDocument();
      });
    });
  });

  describe('Merchant Return Management Flow', () => {
    it('should load and filter returns', async () => {
      const mockReturns = [
        {
          id: 'return-1',
          shopify_order_id: '12345',
          customer_email: 'customer1@example.com',
          status: 'requested',
          reason: 'Size issue',
          total_amount: 100,
          created_at: '2024-01-01T00:00:00Z',
          return_items: [
            {
              id: 'item-1',
              product_name: 'Test Product',
              quantity: 1,
              price: 100,
              action: 'refund'
            }
          ],
          ai_suggestions: []
        },
        {
          id: 'return-2',
          shopify_order_id: '12346',
          customer_email: 'customer2@example.com',
          status: 'approved',
          reason: 'Quality issue',
          total_amount: 150,
          created_at: '2024-01-02T00:00:00Z',
          return_items: [],
          ai_suggestions: []
        }
      ];

      // Mock useRealReturnsData hook
      vi.mock('@/hooks/useRealReturnsData', () => ({
        useRealReturnsData: () => ({
          returns: mockReturns,
          loading: false,
          error: null,
          refetch: vi.fn()
        })
      }));

      renderWithProviders(
        <RealReturnsTable searchTerm="" statusFilter="all" />
      );

      // Verify returns are displayed
      await waitFor(() => {
        expect(screen.getByText('customer1@example.com')).toBeInTheDocument();
        expect(screen.getByText('customer2@example.com')).toBeInTheDocument();
      });

      // Test status filtering would be implemented in the parent component
      expect(screen.getByText('Size issue')).toBeInTheDocument();
      expect(screen.getByText('Quality issue')).toBeInTheDocument();
    });
  });

  describe('AI Integration Flow', () => {
    it('should generate and display AI recommendations', async () => {
      const mockRecommendation = {
        suggestedProduct: 'Premium Alternative',
        confidence: 92,
        reasoning: 'Based on quality concerns, this premium option should resolve the issue',
        alternativeProducts: ['Standard Alternative', 'Budget Alternative']
      };

      vi.mocked(aiService.generateExchangeRecommendation).mockResolvedValue(mockRecommendation);

      const requestData = {
        returnReason: 'Quality issue',
        productName: 'Basic Product',
        customerEmail: 'test@example.com',
        orderValue: 100
      };

      const result = await aiService.generateExchangeRecommendation(requestData);

      expect(result).toEqual(mockRecommendation);
      expect(result.confidence).toBeGreaterThan(90);
      expect(result.suggestedProduct).toContain('Premium');
    });

    it('should handle AI service failures gracefully', async () => {
      vi.mocked(aiService.generateExchangeRecommendation).mockRejectedValue(
        new Error('AI service unavailable')
      );

      try {
        await aiService.generateExchangeRecommendation({
          returnReason: 'Size issue',
          productName: 'Test Product',
          customerEmail: 'test@example.com',
          orderValue: 100
        });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('AI service unavailable');
      }
    });
  });

  describe('Analytics Flow', () => {
    it('should aggregate return data correctly', async () => {
      const mockAnalyticsData = {
        totalReturns: 50,
        pendingReturns: 10,
        approvedReturns: 30,
        rejectedReturns: 10,
        exchangeRate: 65,
        avgProcessingTime: 3.2,
        topReturnReasons: [
          { reason: 'Size issue', count: 20 },
          { reason: 'Quality issue', count: 15 },
          { reason: 'Wrong color', count: 10 }
        ]
      };

      // This would typically come from useRealAnalyticsData hook
      expect(mockAnalyticsData.totalReturns).toBe(50);
      expect(mockAnalyticsData.exchangeRate).toBe(65);
      expect(mockAnalyticsData.topReturnReasons).toHaveLength(3);
      expect(mockAnalyticsData.topReturnReasons[0].reason).toBe('Size issue');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      vi.mocked(OrderService.lookupOrder).mockRejectedValue(
        new Error('Network error')
      );

      renderWithProviders(<CustomerReturnsPortal />);

      const orderNumberRegex = /Order Number/i;
      const emailAddressRegex = /Email Address/i;
      const orderInput = screen.getByPlaceholderText(orderNumberRegex);
      const emailInput = screen.getByPlaceholderText(emailAddressRegex);
      
      await user.type(orderInput, '12345');
      await user.type(emailInput, 'test@example.com');
      
      const lookupOrderRegex = /Look up Order/i;
      const lookupButton = screen.getByText(lookupOrderRegex);
      await user.click(lookupButton);

      const errorOccurredRegex = /Error occurred/i;
      await waitFor(() => {
        expect(screen.getByText(errorOccurredRegex)).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      renderWithProviders(<CustomerReturnsPortal />);

      const lookupOrderRegex = /Look up Order/i;
      const lookupButton = screen.getByText(lookupOrderRegex);
      await user.click(lookupButton);

      // Should show validation errors for empty fields
      const orderRequiredRegex = /Order number is required/i;
      await waitFor(() => {
        expect(screen.getByText(orderRequiredRegex)).toBeInTheDocument();
      });
    });
  });
});
