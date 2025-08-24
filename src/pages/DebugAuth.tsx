import React from 'react';

const DebugAuth = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const shop = urlParams.get('shop');
  const host = urlParams.get('host');
  const code = urlParams.get('code');
  const hmac = urlParams.get('hmac');
  
  const currentUrl = window.location.href;
  const isEmbedded = window.top !== window.self;
  
  // Construct proper Shopify admin URL
  const shopifyAdminUrl = shop ? `https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/apps` : 'N/A';
  
  // Construct proper embedded app URL
  const embeddedAppUrl = shop && host ? 
    `https://admin.shopify.com/store/${shop.replace('.myshopify.com', '')}/apps/returns-automation?shop=${shop}&host=${host}` : 'N/A';

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h2>🔍 Shopify Auth Debug Info</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Environment</h3>
        <p><strong>Is Embedded:</strong> {isEmbedded ? 'Yes' : 'No'}</p>
        <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        <p><strong>Current URL:</strong> {currentUrl}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>URL Parameters</h3>
        <p><strong>shop:</strong> {shop || 'Missing'}</p>
        <p><strong>host:</strong> {host || 'Missing'}</p>
        <p><strong>code:</strong> {code ? 'Present' : 'Missing'}</p>
        <p><strong>hmac:</strong> {hmac ? 'Present' : 'Missing'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Shopify URLs</h3>
        <p><strong>Shopify Admin:</strong> <a href={shopifyAdminUrl} target="_blank">{shopifyAdminUrl}</a></p>
        <p><strong>Embedded App URL:</strong> <a href={embeddedAppUrl} target="_blank">{embeddedAppUrl}</a></p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Expected Flow</h3>
        <ol>
          <li>Install from Shopify Admin</li>
          <li>OAuth → <code>/functions/v1/shopify-oauth-callback</code></li>
          <li>Callback redirects to <code>/auth/inline?shop=X&host=Y</code></li>
          <li>AuthInline uses App Bridge to redirect back to Shopify</li>
          <li>Final URL should be embedded in Shopify admin</li>
        </ol>
      </div>

      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', marginTop: '20px' }}>
        <h3>Test Actions</h3>
        <button 
          onClick={() => {
            if (shop && host) {
              window.location.href = `/dashboard?shop=${shop}&host=${host}`;
            } else {
              alert('Missing shop or host parameter');
            }
          }}
          style={{ margin: '5px', padding: '10px' }}
        >
          Go to Dashboard with params
        </button>
        
        <button 
          onClick={() => {
            window.location.href = embeddedAppUrl;
          }}
          style={{ margin: '5px', padding: '10px' }}
        >
          Try Embedded URL
        </button>
        
        <button 
          onClick={() => {
            console.log('Debug info:', { shop, host, code, hmac, isEmbedded, currentUrl });
          }}
          style={{ margin: '5px', padding: '10px' }}
        >
          Log to Console
        </button>
      </div>
    </div>
  );
};

export default DebugAuth;