import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMerchantSession } from '../contexts/MerchantSessionContext';

const AuthInline = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshSession, isAuthenticated, session, loading } = useMerchantSession();
  
  const shop = searchParams.get('shop');
  const host = searchParams.get('host');
  
  useEffect(() => {
    console.log('🔄 AuthInline: Checking session after OAuth', {
      shop,
      host,
      isAuthenticated,
      loading,
      merchantId: session?.merchantId,
      shopDomain: session?.shopDomain,
      currentUrl: window.location.href
    });

    // If we're still loading, wait
    if (loading) {
      return;
    }

    // If we have a valid session, redirect to dashboard
    if (isAuthenticated && session) {
      console.log('✅ AuthInline: Valid session found, redirecting to dashboard');
      const dashboardUrl = `/dashboard?shop=${encodeURIComponent(shop || session.shopDomain)}&host=${encodeURIComponent(host || '')}`;
      navigate(dashboardUrl, { replace: true });
      return;
    }

    // If no session found, try to refresh once
    if (!isAuthenticated && !loading) {
      console.log('⚠️ AuthInline: No session found, attempting refresh');
      refreshSession().then(() => {
        // After refresh attempt, check again
        if (!isAuthenticated) {
          console.log('❌ AuthInline: No valid session after refresh, redirecting to install');
          const installUrl = `/shopify/install?shop=${encodeURIComponent(shop || '')}&host=${encodeURIComponent(host || '')}`;
          navigate(installUrl, { replace: true });
        }
      });
    }
  }, [isAuthenticated, session, loading, shop, host, navigate, refreshSession]);

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
        <h2 style={{ color: '#1f2937', marginBottom: '10px' }}>Completing Installation...</h2>
        <p style={{ color: '#6b7280' }}>Setting up your H5 Returns Automation</p>
        {shop && (
          <div style={{ marginTop: '15px', fontSize: '14px', color: '#6b7280' }}>
            <div>• Verifying authentication</div>
            <div>• Shop: {shop}</div>
            {session?.merchantId && <div>• Merchant ID: {session.merchantId.slice(0, 8)}...</div>}
          </div>
        )}
        
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

export default AuthInline;