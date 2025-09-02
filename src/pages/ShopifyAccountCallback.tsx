import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, Store, ExternalLink } from "lucide-react";
import AppLayout from "@/components/AppLayout";

interface ShopifyStore {
  id: string;
  name: string;
  domain: string;
  url: string;
  plan: string;
  connected: boolean;
}

const ShopifyAccountCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'stores' | 'connecting' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [stores, setStores] = useState<ShopifyStore[]>([]);
  const [selectedStores, setSelectedStores] = useState<Set<string>>(new Set());
  const [connectingStores, setConnectingStores] = useState<Set<string>>(new Set());

  useEffect(() => {
    handleShopifyCallback();
  }, []);

  const handleShopifyCallback = async () => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`Shopify OAuth error: ${error}`);
      }

      if (!code || !state) {
        throw new Error('Missing OAuth parameters');
      }

      // Validate state
      const storedState = sessionStorage.getItem('shopify_oauth_state');
      if (state !== storedState) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Exchange code for access token and get user info
      const response = await fetch('/api/auth/shopify-account/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setUserInfo(data.user);
      
      // For now, simulate store data - in reality this would come from Shopify Partner API
      const mockStores: ShopifyStore[] = [
        {
          id: 'store_1',
          name: 'Main Store',
          domain: 'main-store.myshopify.com',
          url: 'https://main-store.myshopify.com',
          plan: 'Shopify Plus',
          connected: false
        },
        {
          id: 'store_2', 
          name: 'Secondary Store',
          domain: 'secondary-store.myshopify.com',
          url: 'https://secondary-store.myshopify.com',
          plan: 'Advanced',
          connected: false
        }
      ];
      
      setStores(mockStores);
      setStatus('stores');

    } catch (err) {
      console.error('Shopify account callback error:', err);
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setStatus('error');
    }
  };

  const handleStoreSelection = (storeId: string) => {
    const newSelected = new Set(selectedStores);
    if (newSelected.has(storeId)) {
      newSelected.delete(storeId);
    } else {
      newSelected.add(storeId);
    }
    setSelectedStores(newSelected);
  };

  const handleConnectStores = async () => {
    if (selectedStores.size === 0) return;

    setStatus('connecting');
    setConnectingStores(new Set(selectedStores));

    try {
      // Connect each selected store
      for (const storeId of selectedStores) {
        const store = stores.find(s => s.id === storeId);
        if (!store) continue;

        // Initiate OAuth for this specific store
        const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
        const oauthUrl = `${appUrl}/auth/start?shop=${encodeURIComponent(store.domain)}&next=/dashboard`;
        
        // For the first store, redirect immediately
        // For multiple stores, this would need a different approach
        if (selectedStores.size === 1) {
          window.location.href = oauthUrl;
          return;
        }
      }

      // If multiple stores selected, handle differently
      if (selectedStores.size > 1) {
        // For now, just connect the first one
        const firstStore = stores.find(s => selectedStores.has(s.id));
        if (firstStore) {
          const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
          const oauthUrl = `${appUrl}/auth/start?shop=${encodeURIComponent(firstStore.domain)}&next=/dashboard`;
          window.location.href = oauthUrl;
        }
      }

    } catch (err) {
      console.error('Store connection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect stores');
      setStatus('error');
    }
  };

  if (status === 'processing') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Processing Authentication...</h2>
              <p className="text-muted-foreground text-center">
                We're securely connecting your Shopify account with H5
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (status === 'error') {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-600 mb-2">Authentication Failed</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <Button onClick={() => navigate('/connect-shopify')}>
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (status === 'stores') {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Welcome, {userInfo?.name || 'Shopify Merchant'}!</h1>
            <p className="text-muted-foreground">
              Select the store(s) you want to connect with H5 Returns Automation
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Your Shopify Stores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stores.map((store) => (
                <div
                  key={store.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedStores.has(store.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleStoreSelection(store.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{store.name}</h3>
                      <p className="text-sm text-muted-foreground">{store.domain}</p>
                      <p className="text-xs text-muted-foreground mt-1">Plan: {store.plan}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedStores.has(store.id)}
                        onChange={() => handleStoreSelection(store.id)}
                        className="rounded border-gray-300"
                      />
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {selectedStores.size > 0 && (
            <Card>
              <CardContent className="py-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">
                    Connect {selectedStores.size} store{selectedStores.size > 1 ? 's' : ''}?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You'll be redirected to authorize H5 to access your store data for returns automation.
                  </p>
                  <Button
                    onClick={handleConnectStores}
                    size="lg"
                    className="bg-[#96bf48] hover:bg-[#87a642]"
                    disabled={status === 'connecting'}
                  >
                    {status === 'connecting' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Connect Selected Store{selectedStores.size > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong> After selecting your store(s), you'll be redirected to Shopify 
              to grant H5 permission to access orders, products, and customer data for returns processing.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return null;
};

export default ShopifyAccountCallback;