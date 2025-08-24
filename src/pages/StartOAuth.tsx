import React, { useState } from 'react';

const StartOAuth = () => {
  const [shop, setShop] = useState('');
  const [loading, setLoading] = useState(false);

  const startOAuthFlow = () => {
    if (!shop) {
      alert('Please enter a shop domain');
      return;
    }

    setLoading(true);

    // Ensure shop ends with .myshopify.com
    const shopDomain = shop.includes('.myshopify.com') ? shop : `${shop}.myshopify.com`;
    
    const appUrl = import.meta.env.VITE_APP_URL;
    
    // Use our backend OAuth start endpoint
    const oauthStartUrl = `${appUrl}/functions/v1/shopify-oauth-start?shop=${encodeURIComponent(shopDomain)}`;

    console.log('Starting OAuth flow:', {
      shop: shopDomain,
      oauthStartUrl
    });

    // Redirect to our OAuth start endpoint
    window.location.href = oauthStartUrl;
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#1f2937' }}>
          🚀 Test Shopify OAuth Flow
        </h1>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
            Shop Domain:
          </label>
          <input
            type="text"
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            placeholder="your-store-name (without .myshopify.com)"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            disabled={loading}
          />
          <small style={{ color: '#6b7280', marginTop: '4px', display: 'block' }}>
            Enter your dev store name (e.g., "my-test-store")
          </small>
        </div>

        <button
          onClick={startOAuthFlow}
          disabled={loading || !shop}
          style={{
            width: '100%',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '14px',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Starting OAuth...' : '🔐 Start OAuth Flow'}
        </button>

        <div style={{
          marginTop: '30px',
          padding: '20px',
          backgroundColor: '#f3f4f6',
          borderRadius: '6px'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#1f2937' }}>What happens next:</h3>
          <ol style={{ margin: 0, paddingLeft: '20px', color: '#4b5563' }}>
            <li>You'll be redirected to Shopify OAuth page</li>
            <li>After authorization, Shopify will redirect to our callback</li>
            <li>We'll exchange the code for an access token</li>
            <li>Store merchant data in database</li>
            <li>Redirect to /auth/inline for re-embedding</li>
            <li>AuthInline will use App Bridge to embed in Shopify admin</li>
          </ol>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: '#fef3c7',
          borderRadius: '6px',
          border: '1px solid #f59e0b'
        }}>
          <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
            <strong>⚠️ Important:</strong> Make sure your dev store allows custom apps and that you have the correct permissions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StartOAuth;