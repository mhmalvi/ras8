
import React, { useEffect, useState } from 'react';
import { detectShopDomain } from '@/utils/shopifyInstallation';
import WaitlistLanding from './WaitlistLanding';
import ShopifyInstallEnhanced from './ShopifyInstallEnhanced';

const Index = () => {
  const [shopDetected, setShopDetected] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is coming from Shopify or has shop parameter
    const shopInfo = detectShopDomain();
    const hasShopParam = new URLSearchParams(window.location.search).has('shop');
    
    if (shopInfo || hasShopParam) {
      setShopDetected(true);
    }
    
    setLoading(false);
  }, []);

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
