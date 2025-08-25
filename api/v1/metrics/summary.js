import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing environment variables for metrics API');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable'
      });
    }

    // Get shop from query parameters or headers
    const shop = req.query.shop || req.headers.shop;
    const authHeader = req.headers.authorization;

    console.log('📊 Metrics API request:', {
      shop: !!shop,
      hasAuth: !!authHeader
    });

    if (!shop) {
      return res.status(401).json({
        error: 'Missing shop parameter',
        authenticated: false
      });
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get merchant by shop domain
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, shop_domain')
      .eq('shop_domain', shop)
      .single();

    if (merchantError || !merchant) {
      console.error('❌ Merchant not found for metrics:', merchantError);
      return res.status(401).json({
        error: 'Shop not authorized',
        authenticated: false
      });
    }

    // Get summary metrics for this merchant
    const [
      { count: totalReturns },
      { count: pendingReturns },
      { count: completedReturns }
    ] = await Promise.all([
      supabase
        .from('returns')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id),
      supabase
        .from('returns')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', 'pending'),
      supabase
        .from('returns')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id)
        .eq('status', 'completed')
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalReturns: totalReturns || 0,
        pendingReturns: pendingReturns || 0,
        completedReturns: completedReturns || 0,
        processingRate: totalReturns > 0 ? Math.round((completedReturns / totalReturns) * 100) : 0
      },
      merchant: {
        id: merchant.id,
        shop_domain: merchant.shop_domain
      },
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Metrics API error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}