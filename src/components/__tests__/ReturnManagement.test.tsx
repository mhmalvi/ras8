import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReturnManagement from '../ReturnManagement';

// Mock the hooks
vi.mock('@/hooks/useReturnsManagement', () => ({
  useReturnsManagement: () => ({
    returns: [
      {
        id: '1',
        customer_email: 'test@example.com',
        status: 'requested',
        reason: 'Size too small',
        total_amount: 99.99,
        created_at: '2024-01-01',
        return_items: [{ product_name: 'Test Product', quantity: 1 }]
      }
    ],
    loading: false,
    error: null,
    updateReturn: vi.fn(),
    refetch: vi.fn()
  })
}));

describe('ReturnManagement', () => {
  it('should render returns list', () => {
    render(<ReturnManagement customerEmail="" />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Size too small')).toBeInTheDocument();
  });

  it('should show basic functionality', () => {
    render(<ReturnManagement customerEmail="" />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});