import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import CustomerReturnsPortal from '../CustomerReturnsPortal';
import * as OrderService from '@/services/orderService';
import * as ReturnService from '@/services/returnService';

vi.mock('@/services/orderService');
vi.mock('@/services/returnService');

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CustomerReturnsPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render order lookup form', () => {
    renderWithProviders(<CustomerReturnsPortal />);
    
    expect(screen.getByText(/start your return/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/order number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
  });

  it('should handle order lookup successfully', async () => {
    const mockOrder = {
      id: 'order-123',
      customer: { email: 'test@example.com' },
      line_items: [
        { id: 'item-1', name: 'Test Product', quantity: 2, price: '29.99' }
      ]
    };

    vi.mocked(OrderService.OrderService.lookupOrder).mockResolvedValue(mockOrder as any);
    
    renderWithProviders(<CustomerReturnsPortal />);
    
    fireEvent.change(screen.getByLabelText(/order number/i), {
      target: { value: 'ORDER123' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /look up order/i }));

    await waitFor(() => {
      expect(screen.getByText(/test product/i)).toBeInTheDocument();
    });
  });

  it('should handle order not found', async () => {
    vi.mocked(OrderService.OrderService.lookupOrder).mockRejectedValue(
      new Error('Order not found')
    );
    
    renderWithProviders(<CustomerReturnsPortal />);
    
    fireEvent.change(screen.getByLabelText(/order number/i), {
      target: { value: 'INVALID' }
    });
    fireEvent.change(screen.getByLabelText(/email address/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.click(screen.getByRole('button', { name: /look up order/i }));

    await waitFor(() => {
      expect(screen.getByText(/order not found/i)).toBeInTheDocument();
    });
  });
});