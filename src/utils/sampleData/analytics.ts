
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPES } from './constants';

export const createSampleAnalytics = async (merchantIds: string[]): Promise<number> => {
  const analyticsEvents = [];

  merchantIds.forEach(merchantId => {
    for (let i = 0; i < 25; i++) {
      const daysAgo = Math.floor(Math.random() * 90);
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() - daysAgo);

      analyticsEvents.push({
        merchant_id: merchantId,
        event_type: EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)],
        event_data: {
          value: Math.floor(Math.random() * 200) + 20,
          source: 'dashboard'
        },
        created_at: eventDate.toISOString()
      });
    }
  });

  const { error } = await supabase
    .from('analytics_events')
    .insert(analyticsEvents);

  if (error) throw error;
  return analyticsEvents.length;
};
