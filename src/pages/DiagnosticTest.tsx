import React, { useState } from 'react';

const DiagnosticTest = () => {
  const [results, setResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnostics: any = {};

    // Test 1: Check OAuth callback URL
    try {
      const callbackResponse = await fetch('/functions/v1/shopify-oauth-callback');
      diagnostics.callbackUrlAccessible = callbackResponse.ok;
      diagnostics.callbackResponse = await callbackResponse.text();
    } catch (error) {
      diagnostics.callbackUrlAccessible = false;
      diagnostics.callbackError = error.message;
    }

    // Test 2: Check environment variables
    diagnostics.envVars = {
      clientId: import.meta.env.VITE_SHOPIFY_CLIENT_ID || 'MISSING',
      appUrl: import.meta.env.VITE_APP_URL || 'MISSING',
      devMode: import.meta.env.VITE_DEV_MODE || 'MISSING'
    };

    // Test 3: Check current URL and parameters
    const urlParams = new URLSearchParams(window.location.search);
    diagnostics.currentUrl = {
      full: window.location.href,
      shop: urlParams.get('shop'),
      host: urlParams.get('host'),
      embedded: urlParams.get('embedded'),
      isEmbedded: window.top !== window.self
    };

    // Test 4: Construct proper OAuth URL
    const testShop = 'test-store.myshopify.com';
    const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
    const redirectUri = `https://pvadajelvewdazwmvppk.supabase.co/functions/v1/shopify-oauth-callback`;
    const scopes = 'read_orders,write_orders,read_customers,read_products';
    
    diagnostics.oauthUrl = `https://${testShop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=test`;

    // Test 5: Construct proper embed URL
    const testHost = btoa(`${testShop}/admin`).replace(/=/g, '');
    diagnostics.embedUrl = `https://admin.shopify.com/store/${testShop.replace('.myshopify.com', '')}/apps/returns-automation?shop=${testShop}&host=${testHost}`;

    // Test 6: Test direct app URL with parameters
    diagnostics.directAppUrl = `${window.location.origin}/dashboard?shop=${testShop}&host=${testHost}`;

    setResults(diagnostics);
    setTesting(false);
  };

  const testDirectEmbed = () => {
    const testShop = 'test-store.myshopify.com';
    const testHost = btoa(`${testShop}/admin`).replace(/=/g, '');
    const embedUrl = `https://admin.shopify.com/store/${testShop.replace('.myshopify.com', '')}/apps/returns-automation?shop=${testShop}&host=${testHost}`;
    
    window.open(embedUrl, '_blank');
  };

  const testOAuthFlow = () => {
    const testShop = prompt('Enter your test shop domain (e.g., my-store.myshopify.com):');
    if (!testShop) return;

    const clientId = import.meta.env.VITE_SHOPIFY_CLIENT_ID;
    const redirectUri = `https://pvadajelvewdazwmvppk.supabase.co/functions/v1/shopify-oauth-callback`;
    const scopes = 'read_orders,write_orders,read_customers,read_products';
    
    const oauthUrl = `https://${testShop}/admin/oauth/authorize?client_id=${clientId}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=diagnostic_test`;
    
    console.log('Starting OAuth flow with URL:', oauthUrl);
    window.location.href = oauthUrl;
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      maxWidth: '1200px', 
      margin: '0 auto',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🔧 Shopify App Diagnostic Tool</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={runDiagnostics}
          disabled={testing}
          style={{
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: testing ? 'not-allowed' : 'pointer',
            marginRight: '10px',
            fontSize: '16px'
          }}
        >
          {testing ? 'Running Diagnostics...' : '🔍 Run Full Diagnostics'}
        </button>

        <button
          onClick={testOAuthFlow}
          style={{
            backgroundColor: '#2196F3',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px',
            fontSize: '16px'
          }}
        >
          🔐 Test OAuth Flow
        </button>

        <button
          onClick={testDirectEmbed}
          style={{
            backgroundColor: '#FF9800',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔗 Test Direct Embed URL
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ color: '#333', marginBottom: '15px' }}>Diagnostic Results</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: results.callbackUrlAccessible ? 'green' : 'red' }}>
              ✓ OAuth Callback URL: {results.callbackUrlAccessible ? 'ACCESSIBLE' : 'FAILED'}
            </h3>
            {!results.callbackUrlAccessible && (
              <p style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '4px' }}>
                ERROR: {results.callbackError}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Environment Variables</h3>
            <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
              <pre>{JSON.stringify(results.envVars, null, 2)}</pre>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Current URL Analysis</h3>
            <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
              <pre>{JSON.stringify(results.currentUrl, null, 2)}</pre>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Generated OAuth URL</h3>
            <div style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '4px' }}>
              <a href={results.oauthUrl} target="_blank" style={{ wordBreak: 'break-all' }}>
                {results.oauthUrl}
              </a>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Expected Shopify Embed URL</h3>
            <div style={{ backgroundColor: '#e8f5e8', padding: '10px', borderRadius: '4px' }}>
              <a href={results.embedUrl} target="_blank" style={{ wordBreak: 'break-all' }}>
                {results.embedUrl}
              </a>
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3>Direct App URL (with params)</h3>
            <div style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '4px' }}>
              <a href={results.directAppUrl} target="_blank" style={{ wordBreak: 'break-all' }}>
                {results.directAppUrl}
              </a>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        backgroundColor: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '20px'
      }}>
        <h3>🎯 Common Issues & Solutions</h3>
        <ol style={{ lineHeight: '1.6' }}>
          <li><strong>OAuth Callback Not Accessible:</strong> The frontend route handler may not be working. Check console for errors.</li>
          <li><strong>Shopify Partners Wrong URLs:</strong> Ensure redirect URLs point to https://ras-5.vercel.app domain.</li>
          <li><strong>Host Parameter Invalid:</strong> Must be base64 encoded shop+'/admin' without padding.</li>
          <li><strong>App Not in Shopify Admin:</strong> Final URL must be within Shopify admin iframe.</li>
          <li><strong>Client ID/Secret Wrong:</strong> Check environment variables match Partners dashboard.</li>
        </ol>
      </div>

      <div style={{ 
        backgroundColor: '#ffecb3', 
        padding: '15px', 
        borderRadius: '8px',
        marginTop: '20px',
        border: '1px solid #ffc107'
      }}>
        <h4>🚀 Quick Test Steps:</h4>
        <ol>
          <li>Click "Run Full Diagnostics" to check system status</li>
          <li>Click "Test OAuth Flow" and use your actual dev store domain</li>
          <li>After OAuth, check if you're redirected to /auth/inline</li>
          <li>From /auth/inline, you should be redirected to Shopify admin</li>
          <li>If stuck, try "Test Direct Embed URL" to see if manual embedding works</li>
        </ol>
      </div>
    </div>
  );
};

export default DiagnosticTest;