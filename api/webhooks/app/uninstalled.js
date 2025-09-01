import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shopifyWebhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET || process.env.SHOPIFY_CLIENT_SECRET;

// Verify Shopify webhook HMAC
function verifyWebhookHmac(rawBody, signature, secret) {
  if (!signature || !secret) return false;

  const hmac = signature.replace('sha256=', '');
  const calculatedHmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(hmac, 'hex'),
    Buffer.from(calculatedHmac, 'hex')
  );
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature = req.headers['x-shopify-hmac-sha256'];
    const shopDomain = req.headers['x-shopify-shop-domain'];
    const rawBody = JSON.stringify(req.body);

    console.log('🪝 App uninstall webhook received:', {
      shop: shopDomain,
      hasSignature: !!signature,
      hasSecret: !!shopifyWebhookSecret
    });

    // Verify webhook signature
    if (shopifyWebhookSecret && !verifyWebhookHmac(rawBody, signature, shopifyWebhookSecret)) {
      console.error('❌ Invalid webhook signature');
      return res.status(403).json({ error: 'Invalid signature' });
    }

    // Extract shop domain from payload or header
    const payload = req.body;
    const shop = shopDomain || payload?.shop_domain || payload?.myshopify_domain;

    if (!shop) {
      console.error('❌ No shop domain found in webhook');
      return res.status(400).json({ error: 'Shop domain required' });
    }

    console.log('🔄 Processing app uninstall for shop:', shop);

    // Store webhook event for observability
    if (supabaseUrl && supabaseServiceKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Log webhook event
        await supabase
          .from('webhook_events')
          .insert({
            shop_domain: shop,
            event_type: 'app/uninstalled',
            payload: payload,
            hmac_valid: !!shopifyWebhookSecret,
            processing_status: 'processing',
            created_at: new Date().toISOString()
          });

        // Mark merchant as uninstalled using the database function
        const uninstalled = await supabase
          .rpc('mark_merchant_uninstalled', { p_shop_domain: shop });

        if (uninstalled.data) {
          console.log('✅ Merchant marked as uninstalled:', shop);

          // Log analytics event
          const { data: merchant } = await supabase
            .from('merchants')
            .select('id')
            .eq('shop_domain', shop)
            .single();

          if (merchant) {
            await supabase
              .from('analytics_events')
              .insert({
                merchant_id: merchant.id,
                event_type: 'app_uninstalled',
                event_data: {
                  shop_domain: shop,
                  uninstall_method: 'webhook',
                  timestamp: new Date().toISOString(),
                  webhook_payload: payload
                }
              });
          }

          // Update webhook event status
          await supabase
            .from('webhook_events')
            .update({ 
              processing_status: 'success',
              processed_at: new Date().toISOString()
            })
            .eq('shop_domain', shop)
            .eq('event_type', 'app/uninstalled')
            .order('created_at', { ascending: false })
            .limit(1);

        } else {
          console.warn('⚠️ Merchant not found for uninstall:', shop);
          
          // Still mark webhook as processed
          await supabase
            .from('webhook_events')
            .update({ 
              processing_status: 'success',
              error_message: 'Merchant not found',
              processed_at: new Date().toISOString()
            })
            .eq('shop_domain', shop)
            .eq('event_type', 'app/uninstalled')
            .order('created_at', { ascending: false })
            .limit(1);
        }

      } catch (dbError) {
        console.error('❌ Database error processing uninstall:', dbError);
        
        // Log the error but don't fail the webhook
        if (supabaseUrl && supabaseServiceKey) {
          try {
            const supabase = createClient(supabaseUrl, supabaseServiceKey);
            await supabase
              .from('webhook_events')
              .update({ 
                processing_status: 'failed',
                error_message: dbError.message,
                processed_at: new Date().toISOString()
              })
              .eq('shop_domain', shop)
              .eq('event_type', 'app/uninstalled')
              .order('created_at', { ascending: false })
              .limit(1);
          } catch (e) {
            // Ignore secondary errors
          }
        }
      }
    }

    // Always return success to Shopify (even if our processing failed)
    // This prevents Shopify from retrying the webhook indefinitely
    console.log('✅ App uninstall webhook processed successfully');
    
    return res.status(200).json({ 
      success: true,
      shop,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);

    // Log error webhook if possible
    if (supabaseUrl && supabaseServiceKey && req.headers['x-shopify-shop-domain']) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        await supabase
          .from('webhook_events')
          .insert({
            shop_domain: req.headers['x-shopify-shop-domain'],
            event_type: 'app/uninstalled',
            payload: req.body,
            hmac_valid: false,
            processing_status: 'failed',
            error_message: error.message,
            created_at: new Date().toISOString(),
            processed_at: new Date().toISOString()
          });
      } catch (e) {
        // Ignore secondary errors
      }
    }

    return res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message 
    });
  }
}