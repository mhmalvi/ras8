/**
 * OAuth Initiation Page - Handles top-level OAuth redirect from embedded context
 * This page breaks out of the iframe to perform OAuth in top-level window
 */

import React, { useEffect, useState } from 'react';
import { generateOAuthUrl, validateShopDomain, ensureShopifyDomain } from '@/utils/shopifyInstallation';

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

        if (!host) {
          throw new Error('Missing host parameter');
        }

        const shopDomain = ensureShopifyDomain(shop);
        
        if (!validateShopDomain(shopDomain)) {
          throw new Error(`Invalid shop domain: ${shopDomain}`);
        }

        setStatus('Validating shop domain...');
        console.log('🔐 Initiating OAuth for shop:', { shop: shopDomain, host });

        // Store the host parameter to preserve it through OAuth flow
        sessionStorage.setItem('shopify_oauth_host', host);
        sessionStorage.setItem('shopify_oauth_shop', shopDomain);
        
        setStatus('Redirecting to Shopify for authorization...');
        
        // Generate OAuth URL and redirect (top-level)
        const oauthUrl = generateOAuthUrl(shopDomain);
        console.log('🚀 Redirecting to OAuth URL:', oauthUrl.substring(0, 100) + '...');
        
        // Small delay to show status
        setTimeout(() => {
          window.top!.location.href = oauthUrl;
        }, 1000);
        
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