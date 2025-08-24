
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { detectShopDomain } from '@/utils/shopifyInstallation';
import WaitlistLanding from './WaitlistLanding';
import ShopifyInstallEnhanced from './ShopifyInstallEnhanced';

const Index = () => {
  const [shopDetected, setShopDetected] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shopInfo = detectShopDomain();
    const hasShopParam = urlParams.has('shop');
    const justInstalled = urlParams.has('installed');
    const shop = urlParams.get('shop');
    const host = urlParams.get('host');
    
    // If user just completed installation, redirect to dashboard
    if (justInstalled && shop && host) {
      console.log('🎉 Installation completed, redirecting to dashboard');
      const dashboardUrl = `/dashboard?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}`;
      navigate(dashboardUrl, { replace: true });
      return;
    }
    
    // If shop is detected but not just installed, show installation page
    if (shopInfo || hasShopParam) {
      setShopDetected(true);
    }
    
    setLoading(false);
  }, [navigate]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  // If shop is detected, show installation page
  if (shopDetected) {
    return <ShopifyInstallEnhanced />;
  }

  // Otherwise show waitlist landing
  return <WaitlistLanding />;
};

export default Index;
