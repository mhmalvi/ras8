import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../notificationService';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client');

describe('NotificationService', () => {
  const mockSupabase = supabase as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getNotifications', () => {
    it('should fetch notifications successfully', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          merchant_id: 'merchant-id',
          type: 'return_submitted',
          message: 'New return submitted'
        }
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: mockNotifications,
                error: null
              })
            })
          })
        })
      });

      const result = await NotificationService.getNotifications('merchant-id');

      expect(result).toEqual(mockNotifications);
    });

    it('should handle database errors', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({
                data: null,
                error: { message: 'Database error' }
              })
            })
          })
        })
      });

      await expect(NotificationService.getNotifications('merchant-id')).rejects.toThrow('Database error');
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      const mockResult = 'notification-id';

      mockSupabase.rpc.mockResolvedValue({
        data: mockResult,
        error: null
      });

      const result = await NotificationService.createNotification(
        'merchant-id',
        'return_submitted',
        'Test Title',
        'Test message'
      );

      expect(result).toEqual(mockResult);
    });
  });
});