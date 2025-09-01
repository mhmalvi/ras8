/**
 * Refresh Token Verification Endpoint
 * 
 * Updates the last_verified_at timestamp for a user's token to mark it as fresh.
 * This is useful when tokens are valid but marked as stale due to time.
 */

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log('🔄 Refreshing token verification for user:', userId);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the database function to refresh token verification
    const { data, error } = await supabase
      .rpc('refresh_user_token_verification', { p_user_id: userId });

    if (error) {
      console.error('❌ Error refreshing token verification:', error);
      return res.status(500).json({ error: 'Failed to refresh token verification' });
    }

    if (!data) {
      console.log('⚠️ No tokens refreshed for user:', userId);
      return res.status(404).json({ error: 'No valid tokens found for user' });
    }

    console.log('✅ Token verification refreshed successfully for user:', userId);

    // Return updated integration status
    const { data: integrationStatus, error: statusError } = await supabase
      .rpc('validate_merchant_integration', { p_user_id: userId })
      .single();

    if (statusError) {
      console.error('❌ Error getting integration status:', statusError);
      return res.status(500).json({ error: 'Failed to get integration status' });
    }

    return res.status(200).json({
      success: true,
      message: 'Token verification refreshed successfully',
      integrationStatus
    });

  } catch (error) {
    console.error('❌ Refresh token error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}