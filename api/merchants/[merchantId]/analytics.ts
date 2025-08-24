import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { MerchantSessionService } from '../../../src/services/merchantSessionService';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract and validate session
    const token = MerchantSessionService.extractTokenFromRequest(new Request('http://localhost', {
      headers: {
        'authorization': req.headers.authorization || '',
        'cookie': req.headers.cookie || ''
      }
    }));

    if (!token) {
      return res.status(401).json({ error: 'No session token found' });
    }

    const session = await MerchantSessionService.validateSession(token);
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // Verify merchant ID matches session
    const { merchantId } = req.query;
    if (merchantId !== session.merchantId) {
      return res.status(403).json({ error: 'Access denied to merchant data' });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get analytics summary for this merchant
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Fetch analytics data
    const [returnsData, ordersData, eventsData] = await Promise.all([
      // Returns analytics
      supabase
        .from('returns')
        .select('id, total_amount, status, created_at')
        .eq('merchant_id', merchantId)
        .gte('created_at', startDate.toISOString()),
      
      // Orders analytics (if we have orders table)
      supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('merchant_id', merchantId)
        .gte('created_at', startDate.toISOString()),
      
      // Analytics events
      supabase
        .from('analytics_events')
        .select('event_type, event_data, created_at')
        .eq('merchant_id', merchantId)
        .gte('created_at', startDate.toISOString())
    ]);

    if (returnsData.error) {
      console.error('Error fetching returns analytics:', returnsData.error);
      return res.status(500).json({ error: 'Failed to fetch returns analytics' });
    }

    // Process analytics data
    const returns = returnsData.data || [];
    const orders = ordersData.data || [];
    const events = eventsData.data || [];

    const analytics = {
      summary: {
        totalReturns: returns.length,
        totalReturnValue: returns.reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0),
        totalOrders: orders.length,
        totalOrderValue: orders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
        returnRate: orders.length > 0 ? (returns.length / orders.length * 100).toFixed(2) : '0.00'
      },
      returns: {
        byStatus: returns.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        byDay: returns.reduce((acc, r) => {
          const day = r.created_at.split('T')[0];
          acc[day] = (acc[day] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      },
      events: events.reduce((acc, e) => {
        acc[e.event_type] = (acc[e.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      timeframe: timeframe as string,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    };

    return res.status(200).json({ analytics });

  } catch (error) {
    console.error('❌ Analytics API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}