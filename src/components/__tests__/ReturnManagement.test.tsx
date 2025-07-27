import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/utils/testUtils';
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

vi.mock('@/hooks/useAIRecommendations', () => ({
  useAIRecommendations: () => ({
    recommendations: {},
    loading: false,
    getRecommendation: vi.fn()
  })
}));

describe('ReturnManagement', () => {
  it('should render returns list', () => {
    render(<ReturnManagement />);
    
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Size too small')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('should show approve and reject buttons', () => {
    render(<ReturnManagement />);
    
    expect(screen.getByText('Approve')).toBeInTheDocument();
    expect(screen.getByText('Reject')).toBeInTheDocument();
  });

  it('should filter returns by status', () => {
    render(<ReturnManagement />);
    
    const statusFilter = screen.getByRole('combobox');
    fireEvent.click(statusFilter);
    
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Requested')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('should handle search functionality', () => {
    render(<ReturnManagement />);
    
    const searchInput = screen.getByPlaceholderText(/search returns/i);
    fireEvent.change(searchInput, { target: { value: 'test@example.com' } });
    
    expect(searchInput).toHaveValue('test@example.com');
  });

  it('should show loading state', () => {
    vi.mocked(useReturnsManagement).mockReturnValue({
      returns: [],
      loading: true,
      error: null,
      updateReturn: vi.fn(),
      refetch: vi.fn()
    });

    render(<ReturnManagement />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    vi.mocked(useReturnsManagement).mockReturnValue({
      returns: [],
      loading: false,
      error: 'Failed to load returns',
      updateReturn: vi.fn(),
      refetch: vi.fn()
    });

    render(<ReturnManagement />);
    
    expect(screen.getByText('Failed to load returns')).toBeInTheDocument();
  });
});