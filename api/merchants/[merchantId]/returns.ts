import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { MerchantSessionService } from '../../../src/services/merchantSessionService';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

    if (req.method === 'GET') {
      // Get returns for this merchant
      const { page = '1', limit = '10', status, customer_email } = req.query;
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      let query = supabase
        .from('returns')
        .select('*')
        .eq('merchant_id', merchantId)
        .order('created_at', { ascending: false })
        .range(offset, offset + parseInt(limit as string) - 1);

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      if (customer_email) {
        query = query.ilike('customer_email', `%${customer_email}%`);
      }

      const { data: returns, error, count } = await query;

      if (error) {
        console.error('Error fetching returns:', error);
        return res.status(500).json({ error: 'Failed to fetch returns' });
      }

      return res.status(200).json({
        returns,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: count || returns?.length || 0
        }
      });

    } else if (req.method === 'POST') {
      // Create new return
      const returnData = {
        ...req.body,
        merchant_id: merchantId // Ensure merchant_id is set
      };

      const { data: newReturn, error } = await supabase
        .from('returns')
        .insert(returnData)
        .select()
        .single();

      if (error) {
        console.error('Error creating return:', error);
        return res.status(500).json({ error: 'Failed to create return' });
      }

      // Log analytics event
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: merchantId,
          event_type: 'return_created',
          event_data: {
            return_id: newReturn.id,
            amount: newReturn.total_amount,
            timestamp: new Date().toISOString()
          }
        });

      return res.status(201).json({ return: newReturn });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ Returns API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}