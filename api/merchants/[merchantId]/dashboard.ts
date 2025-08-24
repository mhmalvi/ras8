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

    // Fetch dashboard data for this specific merchant
    const [merchantData, returnsData, ordersData, recentEventsData] = await Promise.all([
      // Merchant info
      supabase
        .from('merchants')
        .select('id, shop_domain, plan_type, settings, created_at')
        .eq('id', merchantId)
        .single(),
      
      // Recent returns
      supabase
        .from('returns')
        .select('id, customer_email, total_amount, status, created_at')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Recent orders (if available)
      supabase
        .from('orders')
        .select('id, customer_email, total_amount, status, created_at')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Recent analytics events
      supabase
        .from('analytics_events')
        .select('event_type, event_data, created_at')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    if (merchantData.error) {
      console.error('Error fetching merchant data:', merchantData.error);
      return res.status(500).json({ error: 'Failed to fetch merchant data' });
    }

    // Calculate summary metrics for this merchant only
    const [totalReturnsResult, totalOrdersResult] = await Promise.all([
      supabase
        .from('returns')
        .select('total_amount', { count: 'exact' })
        .eq('merchant_id', merchantId),
      
      supabase
        .from('orders')
        .select('total_amount', { count: 'exact' })
        .eq('merchant_id', merchantId)
    ]);

    const totalReturns = totalReturnsResult.count || 0;
    const totalOrders = totalOrdersResult.count || 0;
    const totalReturnValue = (totalReturnsResult.data || []).reduce((sum, r) => sum + (parseFloat(r.total_amount) || 0), 0);
    const totalOrderValue = (totalOrdersResult.data || []).reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const dashboardData = {
      merchant: merchantData.data,
      metrics: {
        totalReturns,
        totalOrders,
        totalReturnValue,
        totalOrderValue,
        returnRate: totalOrders > 0 ? (totalReturns / totalOrders * 100).toFixed(2) : '0.00',
        avgReturnValue: totalReturns > 0 ? (totalReturnValue / totalReturns).toFixed(2) : '0.00'
      },
      recentReturns: returnsData.data || [],
      recentOrders: ordersData.data || [],
      recentEvents: recentEventsData.data || [],
      lastUpdated: new Date().toISOString()
    };

    return res.status(200).json(dashboardData);

  } catch (error) {
    console.error('❌ Dashboard API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}