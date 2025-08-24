import React, { useEffect } from 'react';

const AppRedirectHandler = () => {
  useEffect(() => {
    // Get URL parameters from the current URL
    const urlParams = new URLSearchParams(window.location.search);
    const shop = urlParams.get('shop');
    const host = urlParams.get('host');
    const hmac = urlParams.get('hmac');
    const timestamp = urlParams.get('timestamp');
    
    console.log('🔄 App redirect handler activated:', { shop, host, hmac, timestamp });
    
    if (shop && host) {
      // Redirect to our dashboard with the same parameters
      const redirectUrl = `/dashboard?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}`;
      
      console.log('🚀 Redirecting to dashboard:', redirectUrl);
      
      // Use React Router navigation instead of window.location
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 1000);
    } else {
      // No valid parameters, redirect to installation
      const installUrl = `/shopify/install`;
      console.log('❌ Missing parameters, redirecting to install:', installUrl);
      setTimeout(() => {
        window.location.href = installUrl;
      }, 1000);
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Redirecting to Returns Automation</h2>
        <p style={{ color: '#6b7280' }}>Please wait while we redirect you to the correct app URL...</p>
        
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

export default AppRedirectHandler;