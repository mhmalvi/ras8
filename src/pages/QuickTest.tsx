import React from 'react';

const QuickTest = () => {
  const realShop = 'test42434.myshopify.com';
  const realHost = btoa(`${realShop}/admin`).replace(/=/g, '');
  
  const testUrls = {
    // OAuth URL for your real shop
    oauthUrl: `https://${realShop}/admin/oauth/authorize?client_id=2da34c83e89f6645ad1fb2028c7532dd&scope=read_orders,write_orders,read_customers,read_products&redirect_uri=${encodeURIComponent(window.location.origin + '/functions/v1/shopify-oauth-callback')}&state=real_test`,
    
    // Direct embed URL for your real shop
    embedUrl: `https://admin.shopify.com/store/${realShop.replace('.myshopify.com', '')}/apps/returns-automation?shop=${realShop}&host=${realHost}`,
    
    // Auth inline URL (where you should land after OAuth)
    authInlineUrl: `${window.location.origin}/auth/inline?shop=${realShop}&host=${realHost}`,
    
    // Dashboard URL with parameters
    dashboardUrl: `${window.location.origin}/dashboard?shop=${realShop}&host=${realHost}`
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🧪 Quick Test for Your Real Shop</h1>
      <p><strong>Shop:</strong> {realShop}</p>
      <p><strong>Host Parameter:</strong> {realHost}</p>
      
      <div style={{ marginTop: '30px' }}>
        <h2>🔗 Test These URLs:</h2>
        
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
          <h3>1. OAuth Authorization (Start Here)</h3>
          <a 
            href={testUrls.oauthUrl} 
            style={{ 
              display: 'inline-block', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              padding: '10px 20px', 
              textDecoration: 'none', 
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          >
            🔐 Start OAuth Flow
          </a>
          <br />
          <small style={{ wordBreak: 'break-all', color: '#666' }}>{testUrls.oauthUrl}</small>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#e8f5e8', borderRadius: '8px' }}>
          <h3>2. Direct Shopify Embed (Test if OAuth works)</h3>
          <a 
            href={testUrls.embedUrl} 
            target="_blank"
            style={{ 
              display: 'inline-block', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              padding: '10px 20px', 
              textDecoration: 'none', 
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          >
            🏪 Open in Shopify Admin
          </a>
          <br />
          <small style={{ wordBreak: 'break-all', color: '#666' }}>{testUrls.embedUrl}</small>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px' }}>
          <h3>3. Auth Inline Page (OAuth should redirect here)</h3>
          <a 
            href={testUrls.authInlineUrl}
            style={{ 
              display: 'inline-block', 
              backgroundColor: '#FF9800', 
              color: 'white', 
              padding: '10px 20px', 
              textDecoration: 'none', 
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          >
            🔄 Test Auth Inline
          </a>
          <br />
          <small style={{ wordBreak: 'break-all', color: '#666' }}>{testUrls.authInlineUrl}</small>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fce4ec', borderRadius: '8px' }}>
          <h3>4. Dashboard with Parameters</h3>
          <a 
            href={testUrls.dashboardUrl}
            style={{ 
              display: 'inline-block', 
              backgroundColor: '#E91E63', 
              color: 'white', 
              padding: '10px 20px', 
              textDecoration: 'none', 
              borderRadius: '4px',
              marginBottom: '10px'
            }}
          >
            📊 Test Dashboard
          </a>
          <br />
          <small style={{ wordBreak: 'break-all', color: '#666' }}>{testUrls.dashboardUrl}</small>
        </div>
      </div>

      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3>🎯 Expected Flow:</h3>
        <ol style={{ lineHeight: '1.8' }}>
          <li><strong>Click "Start OAuth Flow"</strong> → Shopify authorization page</li>
          <li><strong>Click "Install App"</strong> → Redirect to OAuth callback</li>
          <li><strong>OAuth processes</strong> → Redirect to /auth/inline</li>
          <li><strong>App Bridge redirects</strong> → Back to Shopify admin (embedded)</li>
          <li><strong>Result:</strong> App loads in Shopify admin, no more WebSocket errors</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#ffecb3', borderRadius: '8px', border: '1px solid #ffc107' }}>
        <h4>🔍 If OAuth Flow Fails:</h4>
        <ul>
          <li>Check browser console for errors during callback</li>
          <li>Try the "Test Auth Inline" link directly</li>
          <li>Try the "Open in Shopify Admin" link to test manual embedding</li>
        </ul>
      </div>
    </div>
  );
};

export default QuickTest;