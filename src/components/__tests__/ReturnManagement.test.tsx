import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/providers/TestProviders';
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

// Mock Recharts components
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="chart-container">{children}</div>,
  PieChart: () => <div data-testid="pie-chart" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('ReturnManagement', () => {
  it('should render returns list', () => {
    renderWithProviders(<ReturnManagement customerEmail="" />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Size too small')).toBeInTheDocument();
  });

  it('should show basic functionality', () => {
    renderWithProviders(<ReturnManagement customerEmail="" />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
});