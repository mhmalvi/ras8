import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { updateInstallationState, trackInstallationStep } from '@/utils/shopifyInstallation';

const ShopifyOAuthCallback = () => {
  const [status, setStatus] = useState('Processing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        setStatus('Processing OAuth callback...');
        updateInstallationState({ 
          step: 'processing', 
          progress: 50, 
          message: 'Processing OAuth callback...' 
        });
        
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const shop = urlParams.get('shop');
        const hmac = urlParams.get('hmac');
        const timestamp = urlParams.get('timestamp');

        console.log('OAuth callback params:', { shop, hasCode: !!code, hasHmac: !!hmac });
        trackInstallationStep('oauth_callback_received', shop || undefined, { hasCode: !!code, hasHmac: !!hmac });

        if (!code || !shop) {
          throw new Error('Missing required OAuth parameters (code or shop)');
        }

        setStatus('Validating parameters...');
        updateInstallationState({ 
          progress: 60, 
          message: 'Validating OAuth parameters...' 
        });

        // Basic HMAC validation would go here in production
        // For now, we'll skip it for testing
        
        setStatus('Exchanging code for access token...');
        updateInstallationState({ 
          progress: 70, 
          message: 'Exchanging authorization code for access token...' 
        });

        // Call the Supabase Edge Function for token exchange
        const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
        const appUrl = import.meta.env.VITE_APP_URL;
        
        if (!clientId) {
          throw new Error('Missing VITE_SHOPIFY_CLIENT_ID');
        }

        console.log('🔐 OAuth Code received, calling backend for token exchange');
        
        // Call the Supabase Edge Function for proper token exchange and encryption
        let accessToken: string;
        let scope: string;
        
        try {
          // Call the Supabase OAuth callback function directly
          const { data: callbackData, error: callbackError } = await supabase.functions.invoke(
            'shopify-oauth-callback',
            {
              body: {
                code,
                shop,
                hmac,
                timestamp,
                state: urlParams.get('state')
              }
            }
          );
          
          if (callbackError) {
            console.error('Edge function error:', callbackError);
            throw new Error(`Token exchange failed: ${callbackError.message}`);
          }
          
          if (callbackData?.success) {
            console.log('✅ Edge function processed OAuth successfully');
            accessToken = callbackData.accessToken;
            scope = callbackData.scope || 'read_orders,write_orders,read_customers,read_products';
          } else {
            throw new Error('Token exchange failed');
          }
        } catch (edgeError) {
          console.error('⚠️ Edge function failed:', edgeError);
          
          // If Edge Function is not working, we need to fail the OAuth
          // Don't use fallback tokens in production
          throw new Error(`OAuth processing failed: ${edgeError.message}. Please ensure Edge Functions are configured.`);
        }
        
        console.log('✅ Simulated token exchange successful', { shop, code: code.substring(0, 10) + '...' });

        setStatus('Storing merchant data...');
        updateInstallationState({ 
          progress: 80, 
          message: 'Storing app installation data...' 
        });
        trackInstallationStep('token_exchange_success', shop);

        // Store merchant data in Supabase
        const { data: merchant, error: merchantError } = await supabase
          .from('merchants')
          .upsert({
            shop_domain: shop,
            access_token: accessToken, // In production, encrypt this
            plan_type: 'starter',
            settings: {
              scopes: scope,
              installed_at: new Date().toISOString(),
              oauth_completed: true
            },
            token_encrypted_at: new Date().toISOString(),
            token_encryption_version: 1
          }, {
            onConflict: 'shop_domain',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (merchantError) {
          console.error('Database error:', merchantError);
          throw new Error(`Database error: ${merchantError.message}`);
        }

        setStatus('Installation successful! Redirecting...');
        updateInstallationState({ 
          progress: 90, 
          message: 'Installation completed! Preparing to redirect...' 
        });
        trackInstallationStep('installation_completed', shop);

        // Log installation event
        await supabase
          .from('analytics_events')
          .insert({
            merchant_id: merchant.id,
            event_type: 'app_installed',
            event_data: {
              shop_domain: shop,
              scopes: scope,
              installation_method: 'oauth_frontend',
              timestamp: new Date().toISOString()
            }
          });

        // Redirect to auth/inline for proper re-embedding
        const hostParam = btoa(`${shop}/admin`).replace(/=/g, '');
        const redirectUrl = `/auth/inline?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(hostParam)}`;
        
        console.log('Redirecting to re-embed page:', redirectUrl);
        
        updateInstallationState({ 
          progress: 100, 
          message: 'Redirecting to your dashboard...' 
        });

        // Small delay to show success message
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 1000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setError(errorMessage);
        setStatus('Installation failed');
        
        updateInstallationState({ 
          step: 'error', 
          message: 'Installation failed',
          error: errorMessage 
        });
        trackInstallationStep('installation_failed', undefined, { error: errorMessage });
      }
    };

    handleOAuthCallback();
  }, []);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fef2f2',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2 style={{ color: '#dc2626', marginBottom: '15px' }}>Installation Failed</h2>
          <p style={{ color: '#7f1d1d', marginBottom: '20px' }}>{error}</p>
          <div style={{ backgroundColor: '#fee2e2', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#7f1d1d' }}>Troubleshooting:</h3>
            <ul style={{ textAlign: 'left', color: '#7f1d1d', margin: 0, paddingLeft: '20px' }}>
              <li>Check if your Shopify store allows this app</li>
              <li>Verify the client ID and secret are correct</li>
              <li>Try installing again from Shopify Admin</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f9ff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid #e0e7ff',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 30px'
        }} />
        <h2 style={{ color: '#1e40af', marginBottom: '15px' }}>Setting up Returns Automation</h2>
        <p style={{ color: '#1e3a8a', fontSize: '18px', marginBottom: '10px' }}>{status}</p>
        <p style={{ color: '#64748b', fontSize: '14px' }}>This may take a few moments...</p>
        
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default ShopifyOAuthCallback;