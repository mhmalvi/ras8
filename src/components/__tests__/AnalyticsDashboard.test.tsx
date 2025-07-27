import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils/testUtils';
import AnalyticsDashboard from '../AnalyticsDashboard';

// Mock the analytics hook
vi.mock('@/hooks/useRealAnalyticsData', () => ({
  useRealAnalyticsData: () => ({
    analytics: {
      totalReturns: 150,
      totalRevenue: 12500,
      totalExchanges: 45,
      exchangeRate: 30,
      avgProcessingTime: 2.5,
      returnRate: 8.5,
      customerSatisfactionScore: 4.2,
      aiAcceptanceRate: 75,
      revenueImpact: 25,
      returnsByStatus: {
        requested: 20,
        approved: 80,
        completed: 50
      },
      topReturnReasons: [
        { reason: 'Size issues', count: 45 },
        { reason: 'Quality concerns', count: 30 }
      ],
      monthlyTrends: [
        { month: 'Jan', returns: 40, revenue: 3200, exchanges: 12 },
        { month: 'Feb', returns: 55, revenue: 4100, exchanges: 18 }
      ],
      recentActivity: []
    },
    loading: false,
    error: null,
    refetch: vi.fn()
  })
}));

describe('AnalyticsDashboard', () => {
  it('should render key metrics', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('150')).toBeInTheDocument(); // Total returns
    expect(screen.getByText('$12,500')).toBeInTheDocument(); // Total revenue
    expect(screen.getByText('45')).toBeInTheDocument(); // Total exchanges
    expect(screen.getByText('30%')).toBeInTheDocument(); // Exchange rate
  });

  it('should display returns by status chart', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Returns by Status')).toBeInTheDocument();
  });

  it('should show top return reasons', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Size issues')).toBeInTheDocument();
    expect(screen.getByText('Quality concerns')).toBeInTheDocument();
  });

  it('should display monthly trends chart', () => {
    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Monthly Trends')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    vi.mocked(useRealAnalyticsData).mockReturnValue({
      analytics: null,
      loading: true,
      error: null,
      refetch: vi.fn()
    });

    render(<AnalyticsDashboard />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle error state', () => {
    vi.mocked(useRealAnalyticsData).mockReturnValue({
      analytics: null,
      loading: false,
      error: 'Failed to load analytics',
      refetch: vi.fn()
    });

    render(<AnalyticsDashboard />);
    
    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
  });
});