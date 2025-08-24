import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ShopifyAuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const shop = searchParams.get('shop');
        const host = searchParams.get('host');
        const state = searchParams.get('state');

        console.log('🔄 Processing Shopify OAuth callback:', { code: !!code, shop, host, state });

        if (!code || !shop) {
          throw new Error('Missing required OAuth parameters');
        }

        // Store OAuth state for processing
        const authData = {
          code,
          shop,
          host,
          state,
          timestamp: Date.now()
        };

        // Store in session storage for the next step
        sessionStorage.setItem('shopify_auth_data', JSON.stringify(authData));

        // Call the backend OAuth callback function
        const { data, error } = await supabase.functions.invoke('shopify-oauth-callback', {
          body: authData
        });

        if (error) {
          console.error('❌ OAuth callback error:', error);
          throw error;
        }

        console.log('✅ OAuth callback successful:', data);

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect to dashboard with auth parameters
        const redirectUrl = `/dashboard?shop=${encodeURIComponent(shop)}${host ? `&host=${encodeURIComponent(host)}` : ''}`;
        
        // Use setTimeout to show success message briefly
        setTimeout(() => {
          if (host) {
            // In embedded context, use App Bridge redirect
            const appBridge = (window as any).app;
            if (appBridge) {
              appBridge.getState().then(() => {
                appBridge.dispatch({
                  type: 'NAVIGATE',
                  payload: { path: redirectUrl }
                });
              });
            } else {
              window.location.href = redirectUrl;
            }
          } else {
            navigate(redirectUrl, { replace: true });
          }
        }, 1500);

      } catch (error) {
        console.error('❌ OAuth callback failed:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-6 max-w-md">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <h2 className="text-xl font-semibold">Authenticating...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-green-600">Success!</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
          </>
        )}
        
        <p className="text-muted-foreground">{message}</p>
        
        {status === 'error' && (
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
};

export default ShopifyAuthCallback;