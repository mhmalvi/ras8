import React, { useEffect, useState } from 'react';
import { useAppBridge } from '@/components/AppBridgeProvider';

const EmbedDebug = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const { isEmbedded, loading, app } = useAppBridge();

  useEffect(() => {
    const gatherDebugInfo = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const currentUrl = window.location.href;
      const referrer = document.referrer;
      const userAgent = navigator.userAgent;
      
      const info = {
        // URL Information
        currentUrl,
        referrer,
        userAgent,
        
        // URL Parameters
        shop: urlParams.get('shop'),
        host: urlParams.get('host'),
        hmac: urlParams.get('hmac'),
        timestamp: urlParams.get('timestamp'),
        
        // Environment
        isEmbedded,
        loading,
        hasAppBridge: !!app,
        isInIframe: window.top !== window.self,
        
        // Environment Variables
        clientId: import.meta.env.VITE_SHOPIFY_CLIENT_ID,
        appUrl: import.meta.env.VITE_APP_URL,
        devMode: import.meta.env.VITE_DEV_MODE,
        
        // Browser Info
        windowLocation: {
          href: window.location.href,
          origin: window.location.origin,
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash
        },
        
        // Timing
        currentTime: new Date().toISOString(),
        
        // Frame Detection
        frameInfo: {
          isTopWindow: window === window.top,
          hasParent: window.parent !== window,
          parentOrigin: window.parent !== window ? 'Different window' : 'Same window'
        }
      };
      
      setDebugInfo(info);
    };

    gatherDebugInfo();
  }, [isEmbedded, loading, app]);

  const testRedirectToShopify = () => {
    const shop = debugInfo.shop || 'test-3sdfsdfgerfweevdv.myshopify.com';
    const shopifyUrl = `https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/apps/returns-automation`;
    console.log('🔗 Testing redirect to Shopify:', shopifyUrl);
    window.open(shopifyUrl, '_blank');
  };

  const testDirectDashboard = () => {
    const shop = debugInfo.shop || 'test-3sdfsdfgerfweevdv.myshopify.com';
    const host = debugInfo.host || btoa(`${shop}/admin`).replace(/=/g, '');
    const dashboardUrl = `/dashboard?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}`;
    console.log('🏠 Testing direct dashboard:', dashboardUrl);
    window.location.href = dashboardUrl;
  };

  const copyDebugInfo = () => {
    const text = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(text);
    alert('Debug info copied to clipboard!');
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      fontSize: '12px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>🐛 Embedded App Debug Information</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '20px',
        marginBottom: '20px'
      }}>
        {/* Status Cards */}
        <div style={{ 
          backgroundColor: isEmbedded ? '#d4edda' : '#f8d7da',
          border: `1px solid ${isEmbedded ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '5px',
          padding: '15px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: isEmbedded ? '#155724' : '#721c24' }}>
            🏪 Embedding Status
          </h3>
          <p><strong>Is Embedded:</strong> {isEmbedded ? '✅ YES' : '❌ NO'}</p>
          <p><strong>App Bridge:</strong> {app ? '✅ LOADED' : '❌ NOT LOADED'}</p>
          <p><strong>In iframe:</strong> {debugInfo.frameInfo?.isTopWindow === false ? '✅ YES' : '❌ NO'}</p>
        </div>

        <div style={{ 
          backgroundColor: '#d1ecf1',
          border: '1px solid #bee5eb',
          borderRadius: '5px',
          padding: '15px'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>🔗 Parameters</h3>
          <p><strong>Shop:</strong> {debugInfo.shop || '❌ MISSING'}</p>
          <p><strong>Host:</strong> {debugInfo.host ? '✅ PRESENT' : '❌ MISSING'}</p>
          <p><strong>HMAC:</strong> {debugInfo.hmac ? '✅ PRESENT' : '❌ MISSING'}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={testDirectDashboard}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            margin: '5px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🏠 Test Direct Dashboard
        </button>
        
        <button
          onClick={testRedirectToShopify}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            margin: '5px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          🔗 Test Shopify Redirect
        </button>
        
        <button
          onClick={copyDebugInfo}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            margin: '5px',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          📋 Copy Debug Info
        </button>
      </div>

      {/* Debug Information */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '5px',
        padding: '15px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>🔍 Full Debug Information</h3>
        <pre style={{ 
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '3px',
          padding: '10px',
          overflow: 'auto',
          maxHeight: '400px',
          fontSize: '11px',
          lineHeight: '1.4'
        }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Troubleshooting Steps */}
      <div style={{ 
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px',
        padding: '15px',
        marginTop: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#856404' }}>🔧 Troubleshooting Steps</h3>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
          <li><strong>Check Partners Dashboard:</strong> Ensure App URL is set to <code>https://ras-5.vercel.app</code></li>
          <li><strong>Verify Redirect URLs:</strong> Should include oauth callback, auth/inline, and dashboard</li>
          <li><strong>Test Installation:</strong> Use <code>/shopify/install</code> to start fresh installation</li>
          <li><strong>Check Console:</strong> Look for JavaScript errors in browser console</li>
          <li><strong>Verify Deployment:</strong> Ensure app is deployed and accessible at https://ras-5.vercel.app</li>
        </ol>
      </div>
    </div>
  );
};

export default EmbedDebug;