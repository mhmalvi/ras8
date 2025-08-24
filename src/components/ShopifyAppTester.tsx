import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAppBridge } from '@/components/AppBridgeProvider';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Smartphone,
  Monitor,
  Globe
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'pending';
  message: string;
}

const ShopifyAppTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);
  const [testShopDomain, setTestShopDomain] = useState('');
  const { isEmbedded, app, loading } = useAppBridge();
  const { toast } = useToast();

  const updateTestResult = (name: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      if (existing) {
        return prev.map(r => r.name === name ? { name, status, message } : r);
      }
      return [...prev, { name, status, message }];
    });
  };

  const runAppBridgeTests = async () => {
    setTesting(true);
    setTestResults([]);

    // Test 1: App Bridge Detection
    updateTestResult('App Bridge Detection', 'pending', 'Checking App Bridge status...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (isEmbedded) {
      updateTestResult('App Bridge Detection', 'success', '✅ App is running in embedded mode');
    } else {
      updateTestResult('App Bridge Detection', 'error', '❌ App is not in embedded mode');
    }

    // Test 2: App Bridge Initialization
    updateTestResult('App Bridge Initialization', 'pending', 'Checking App Bridge initialization...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (app) {
      updateTestResult('App Bridge Initialization', 'success', '✅ App Bridge initialized successfully');
    } else {
      updateTestResult('App Bridge Initialization', 'error', '❌ App Bridge not initialized');
    }

    // Test 3: Shopify Configuration
    updateTestResult('Shopify Configuration', 'pending', 'Checking Shopify configuration...');
    try {
      const { data, error } = await supabase.functions.invoke('get-shopify-config');
      if (error) throw error;
      
      if (data?.clientId && data?.configured) {
        updateTestResult('Shopify Configuration', 'success', `✅ Client ID configured: ${data.clientId.substring(0, 8)}...`);
      } else {
        updateTestResult('Shopify Configuration', 'error', '❌ Shopify Client ID not configured');
      }
    } catch (error) {
      updateTestResult('Shopify Configuration', 'error', `❌ Configuration error: ${error.message}`);
    }

    // Test 4: Webhook Endpoints
    updateTestResult('Webhook Endpoints', 'pending', 'Checking webhook endpoints...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Test if webhook endpoint is accessible
      const webhookUrl = `${window.location.origin}/functions/v1/shopify-webhook`;
      const response = await fetch(webhookUrl, { method: 'OPTIONS' });
      
      if (response.ok) {
        updateTestResult('Webhook Endpoints', 'success', '✅ Webhook endpoints accessible');
      } else {
        updateTestResult('Webhook Endpoints', 'error', '❌ Webhook endpoints not accessible');
      }
    } catch (error) {
      updateTestResult('Webhook Endpoints', 'error', `❌ Webhook test failed: ${error.message}`);
    }

    // Test 5: OAuth Callback
    updateTestResult('OAuth Callback', 'pending', 'Checking OAuth callback endpoint...');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const callbackUrl = `https://pvadajelvewdazwmvppk.supabase.co/functions/v1/shopify-oauth-callback`;
      const response = await fetch(callbackUrl, { method: 'OPTIONS' });
      
      if (response.ok) {
        updateTestResult('OAuth Callback', 'success', '✅ OAuth callback endpoint accessible');
      } else {
        updateTestResult('OAuth Callback', 'error', '❌ OAuth callback endpoint not accessible');
      }
    } catch (error) {
      updateTestResult('OAuth Callback', 'error', `❌ OAuth callback test failed: ${error.message}`);
    }

    setTesting(false);
  };

  const testInstallationFlow = async () => {
    if (!testShopDomain.trim()) {
      toast({
        title: "Shop domain required",
        description: "Please enter a shop domain to test the installation flow.",
        variant: "destructive",
      });
      return;
    }

    const cleanDomain = testShopDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const installUrl = `${window.location.origin}/shopify/install?shop=${cleanDomain}`;
    
    window.open(installUrl, '_blank');
    
    toast({
      title: "Installation test opened",
      description: "The installation flow has been opened in a new tab.",
    });
  };

  const getStatusIcon = (status: 'success' | 'error' | 'pending') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const overallStatus = testResults.length > 0 ? (
    testResults.every(r => r.status === 'success') ? 'success' :
    testResults.some(r => r.status === 'error') ? 'error' : 'pending'
  ) : null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Shopify App Testing Dashboard
          </CardTitle>
          <CardDescription>
            Test your Shopify app integration and embedded functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {isEmbedded ? <Smartphone className="h-4 w-4 text-green-500" /> : <Monitor className="h-4 w-4 text-gray-500" />}
                <span className="font-medium">Mode</span>
              </div>
              <Badge variant={isEmbedded ? "default" : "secondary"}>
                {isEmbedded ? "Embedded" : "Standalone"}
              </Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-4 w-4 text-blue-500" />
                <span className="font-medium">App Bridge</span>
              </div>
              <Badge variant={app ? "default" : "destructive"}>
                {loading ? "Loading..." : app ? "Ready" : "Not Available"}
              </Badge>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Environment</span>
              </div>
              <Badge variant="outline">
                {window.location.hostname.includes('localhost') ? 'Development' : 'Production'}
              </Badge>
            </div>
          </div>

          {/* Test Controls */}
          <div className="flex gap-2">
            <Button 
              onClick={runAppBridgeTests} 
              disabled={testing}
              className="flex-1"
            >
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run App Tests
            </Button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Test Results</h3>
                {overallStatus && (
                  <Badge variant={overallStatus === 'success' ? 'default' : 'destructive'}>
                    {overallStatus === 'success' ? 'All Tests Passed' : 'Some Tests Failed'}
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    {getStatusIcon(result.status)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{result.name}</div>
                      <div className="text-sm text-muted-foreground">{result.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Installation Test */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Test Installation Flow</h3>
            <div className="flex gap-2">
              <Input
                placeholder="test-store.myshopify.com"
                value={testShopDomain}
                onChange={(e) => setTestShopDomain(e.target.value)}
                className="flex-1"
              />
              <Button onClick={testInstallationFlow} variant="outline">
                Test Install
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopifyAppTester;