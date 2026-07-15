import { createClient } from '@supabase/supabase-js';
import { withRateLimit, RATE_LIMITS } from '../../_middleware/rateLimit';
import { withErrorHandler } from '../../_middleware/errorHandler';
import { logger, dbLogger } from '../../_middleware/logger';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error('Missing environment variables for returns API', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      });
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing database configuration'
      });
    }

    // Get shop from query parameters or headers
    const shop = req.query.shop || req.headers.shop;
    const authHeader = req.headers.authorization;

    logger.debug('Returns API request', {
      shop: shop || 'none',
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
      dbLogger.queryError('select', 'merchants', merchantError?.message || 'Merchant not found', {
        shop,
        code: merchantError?.code
      });
      return res.status(401).json({
        error: 'Shop not authorized',
        authenticated: false
      });
    }

    // Get returns for this merchant
    const { data: returns, error: returnsError } = await supabase
      .from('returns')
      .select(`
        id,
        order_id,
        customer_name,
        status,
        reason,
        created_at,
        updated_at
      `)
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (returnsError) {
      dbLogger.queryError('select', 'returns', returnsError.message, {
        merchantId: merchant.id,
        shop,
        code: returnsError.code
      });
      return res.status(500).json({
        error: 'Failed to fetch returns',
        details: returnsError.message
      });
    }

    return res.status(200).json({
      success: true,
      data: returns || [],
      count: returns?.length || 0,
      merchant: {
        id: merchant.id,
        shop_domain: merchant.shop_domain
      }
    });

  } catch (error) {
    logger.error('Returns API error', {
      shop: req.query?.shop || req.headers?.shop,
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
}

// Export handler with rate limiting and error handling
export default withRateLimit(RATE_LIMITS.apiAuthenticated, withErrorHandler(handler));