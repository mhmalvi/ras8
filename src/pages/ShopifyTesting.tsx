import React from 'react';
import AppLayout from '@/components/AppLayout';
import ShopifyAppTester from '@/components/ShopifyAppTester';

const ShopifyTesting = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shopify App Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test and validate your Shopify embedded app functionality
          </p>
        </div>
        
        <ShopifyAppTester />
      </div>
    </AppLayout>
  );
};

export default ShopifyTesting;