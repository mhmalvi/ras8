import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MonitoringService } from '../monitoringService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('MonitoringService', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordMetric', () => {
    it('should record metric successfully', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({ error: null });

      await MonitoringService.recordMetric('api_response_time', 250, 'gauge', { endpoint: '/api/returns' });

      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('record-metric', {
        body: {
          metric_name: 'api_response_time',
          metric_value: 250,
          metric_type: 'gauge',
          labels: { endpoint: '/api/returns' },
          merchant_id: undefined
        }
      });
    });

    it('should handle metric recording errors', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({ 
        error: { message: 'Monitoring service down' }
      });

      // Should not throw - just log the error
      await expect(
        MonitoringService.recordMetric('test_metric', 100)
      ).resolves.not.toThrow();
    });
  });

  describe('getDashboardMetrics', () => {
    it('should fetch dashboard metrics successfully', async () => {
      const mockMetrics = {
        totalRequests: 1000,
        errorRate: 0.02,
        avgResponseTime: 200,
        activeAlerts: 1,
        systemHealth: 'healthy' as const
      };

      mockSupabase.functions.invoke.mockResolvedValue({
        data: mockMetrics,
        error: null
      });

      const result = await MonitoringService.getDashboardMetrics();

      expect(result).toEqual(mockMetrics);
    });

    it('should handle errors with fallback', async () => {
      mockSupabase.functions.invoke.mockResolvedValue({
        data: null,
        error: { message: 'Service unavailable' }
      });

      const result = await MonitoringService.getDashboardMetrics();

      expect(result).toEqual({
        totalRequests: 0,
        errorRate: 0,
        avgResponseTime: 0,
        activeAlerts: 0,
        systemHealth: 'warning'
      });
    });
  });
});