
import { supabase } from '@/integrations/supabase/client';
import { EVENT_TYPES } from './constants';

export const createSampleAnalytics = async (merchantIds: string[]): Promise<number> => {
  if (!merchantIds || merchantIds.length === 0) {
    throw new Error('No merchant IDs provided for creating analytics');
  }

  console.log(`Creating analytics events for ${merchantIds.length} merchants`);

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

  try {
    console.log(`Inserting ${analyticsEvents.length} analytics events:`, analyticsEvents.slice(0, 2)); // Log first 2 for debugging
    
    const { error } = await supabase
      .from('analytics_events')
      .insert(analyticsEvents);

    if (error) {
      console.error('Supabase error creating analytics events:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Failed to create analytics events: ${error.message}`);
    }

    console.log(`Successfully created ${analyticsEvents.length} analytics events`);
    return analyticsEvents.length;
  } catch (error) {
    console.error('Analytics events creation failed:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};
