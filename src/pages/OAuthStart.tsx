/**
 * OAuth Initiation Page - Handles top-level OAuth redirect from embedded context
 * This page breaks out of the iframe to perform OAuth in top-level window
 */

import React, { useEffect, useState } from 'react';

const OAuthStart = () => {
  const [status, setStatus] = useState('Initializing OAuth...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initiateOAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const shop = urlParams.get('shop');
        const host = urlParams.get('host');

        if (!shop) {
          throw new Error('Missing shop parameter');
        }

        // Basic shop domain validation
        if (!shop.endsWith('.myshopify.com')) {
          throw new Error(`Invalid shop domain: ${shop}`);
        }

        setStatus('Validating shop domain...');
        console.log('🔐 Initiating OAuth for shop:', { shop, host });
        
        setStatus('Redirecting to authorization...');
        
        // Build OAuth URL directly
        const shopifyClientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID || 'test-client-id-12345';
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        
        if (!shopifyClientId) {
          throw new Error('Missing Shopify Client ID configuration');
        }

        const scopes = [
          'read_orders',
          'write_orders', 
          'read_customers',
          'read_products',
          'write_draft_orders',
          'read_inventory',
          'read_locations'
        ].join(',');

        // Generate state for CSRF protection
        const state = btoa(JSON.stringify({
          shop,
          host: host || '',
          timestamp: Date.now(),
          nonce: Math.random().toString(36).substring(7)
        })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        
        // Store state in sessionStorage for callback validation
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_shop', shop);
        if (host) {
          sessionStorage.setItem('oauth_host', host);
        }

        const redirectUri = `${appUrl}/auth/callback`;
        const oauthUrl = new URL(`https://${shop}/admin/oauth/authorize`);
        oauthUrl.searchParams.set('client_id', shopifyClientId);
        oauthUrl.searchParams.set('scope', scopes);
        oauthUrl.searchParams.set('redirect_uri', redirectUri);
        oauthUrl.searchParams.set('state', state);

        console.log('🚀 Redirecting to OAuth URL:', oauthUrl.toString());
        
        // Small delay to show status
        setTimeout(() => {
          // Force top-level navigation to break out of iframe
          if (window.top && window.top !== window.self) {
            window.top.location.href = oauthUrl.toString();
          } else {
            window.location.href = oauthUrl.toString();
          }
        }, 100);
        
      } catch (error) {
        console.error('OAuth initiation error:', error);
        setError(error instanceof Error ? error.message : String(error));
      }
    };

    initiateOAuth();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center max-w-md p-6">
          <div className="text-red-600 text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">OAuth Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-blue-800 mb-2">Setting up your app</h2>
        <p className="text-blue-700">{status}</p>
      </div>
    </div>
  );
};

export default OAuthStart;