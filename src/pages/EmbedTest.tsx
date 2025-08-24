import React, { useEffect, useState } from 'react';
import { useAppBridge } from '@/components/AppBridgeProvider';

const EmbedTest = () => {
  const [testResults, setTestResults] = useState<any>({});
  const { isEmbedded, loading, app } = useAppBridge();

  useEffect(() => {
    const runTests = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shop = urlParams.get('shop');
      const host = urlParams.get('host');
      
      setTestResults({
        isEmbedded,
        loading,
        shop,
        host,
        hasAppBridge: !!app,
        userAgent: navigator.userAgent,
        isInIframe: window.top !== window.self,
        currentUrl: window.location.href,
        shopifyDomain: shop?.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`,
        decodedHost: host ? atob(host.replace(/-/g, '+').replace(/_/g, '/').padEnd(host.length + (4 - host.length % 4) % 4, '=')) : null
      });
    };

    runTests();
  }, [isEmbedded, loading, app]);

  const testEmbedding = () => {
    const shop = 'test-store-8726.myshopify.com'; // Replace with your dev store
    const host = btoa(`${shop}/admin`).replace(/=/g, '');
    
    // Construct the proper Shopify embed URL
    const embedUrl = `https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/apps/returns-automation?shop=${shop}&host=${host}`;
    
    console.log('Testing embed URL:', embedUrl);
    window.open(embedUrl, '_blank');
  };

  const testAppBridge = async () => {
    try {
      const shop = testResults.shop || 'test-store-8726.myshopify.com';
      const host = testResults.host || btoa(`${shop}/admin`).replace(/=/g, '');
      
      const { default: createApp, actions } = await import('@shopify/app-bridge');
      
      const testApp = createApp({
        apiKey: import.meta.env.VITE_SHOPIFY_CLIENT_ID,
        host: host,
      });

      console.log('App Bridge created successfully:', testApp);
      
      // Test redirect
      const redirect = actions.Redirect.create(testApp);
      redirect.dispatch(actions.Redirect.Action.APP, '/dashboard');
      
    } catch (error) {
      console.error('App Bridge test failed:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🧪 Shopify Embedding Test</h1>
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '15px', marginBottom: '20px', borderRadius: '5px' }}>
        <h3>Test Results</h3>
        <pre style={{ backgroundColor: 'white', padding: '10px', borderRadius: '3px', overflow: 'auto' }}>
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Status Indicators</h3>
        <p>🔗 <strong>Is Embedded:</strong> 
          <span style={{ color: isEmbedded ? 'green' : 'red' }}>
            {isEmbedded ? ' ✅ YES' : ' ❌ NO'}
          </span>
        </p>
        <p>🚀 <strong>App Bridge:</strong> 
          <span style={{ color: app ? 'green' : 'red' }}>
            {app ? ' ✅ LOADED' : ' ❌ NOT LOADED'}
          </span>
        </p>
        <p>🏪 <strong>Shop:</strong> 
          <span style={{ color: testResults.shop ? 'green' : 'red' }}>
            {testResults.shop || ' ❌ MISSING'}
          </span>
        </p>
        <p>🏠 <strong>Host:</strong> 
          <span style={{ color: testResults.host ? 'green' : 'red' }}>
            {testResults.host || ' ❌ MISSING'}
          </span>
        </p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Manual Tests</h3>
        <button 
          onClick={testEmbedding}
          style={{ 
            margin: '5px', 
            padding: '10px 15px', 
            backgroundColor: '#007cba', 
            color: 'white', 
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🔗 Test Shopify Embed URL
        </button>
        
        <button 
          onClick={testAppBridge}
          style={{ 
            margin: '5px', 
            padding: '10px 15px', 
            backgroundColor: '#95bf47', 
            color: 'white', 
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🚀 Test App Bridge
        </button>
      </div>

      <div style={{ backgroundColor: '#fff3cd', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>⚠️ Troubleshooting Steps</h3>
        <ol>
          <li><strong>Check Shopify Partners Dashboard:</strong> Ensure redirect URLs point to <code>/functions/v1/shopify-oauth-callback</code></li>
          <li><strong>Deploy Supabase Functions:</strong> Run <code>supabase functions deploy shopify-oauth-callback</code></li>
          <li><strong>Update App URL:</strong> Make sure it matches https://ras-5.vercel.app</li>
          <li><strong>Test Direct URL:</strong> Try the direct Shopify embed URL manually</li>
        </ol>
      </div>

      {!isEmbedded && (
        <div style={{ backgroundColor: '#f8d7da', padding: '15px', borderRadius: '5px', color: '#721c24' }}>
          <h3>❌ Not Embedded</h3>
          <p>Your app is not running inside Shopify admin. This means:</p>
          <ul>
            <li>OAuth flow is not completing properly</li>
            <li>App Bridge cannot establish connection</li>
            <li>Shopify admin won't load your app</li>
          </ul>
        </div>
      )}
      
      {isEmbedded && (
        <div style={{ backgroundColor: '#d1edff', padding: '15px', borderRadius: '5px', color: '#0c5460' }}>
          <h3>✅ Successfully Embedded</h3>
          <p>Your app is running inside Shopify admin! The Argus errors should stop.</p>
        </div>
      )}
    </div>
  );
};

export default EmbedTest;