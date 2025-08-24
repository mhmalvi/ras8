import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppBridge } from '@/components/AppBridgeProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

const PartnerPlatformTest: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { app, isEmbedded, loading } = useAppBridge();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    try {
      addLog(`Running ${testName}...`);
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: result }));
      addLog(`${testName}: ${result ? 'PASS' : 'FAIL'}`);
      return result;
    } catch (error) {
      addLog(`${testName}: ERROR - ${error}`);
      setTestResults(prev => ({ ...prev, [testName]: false }));
      return false;
    }
  };

  const testAppBridge = async (): Promise<boolean> => {
    if (!app) return false;
    try {
      const features = await app.featuresAvailable();
      addLog(`App Bridge features: ${JSON.stringify(features)}`);
      return true;
    } catch (error) {
      addLog(`App Bridge test failed: ${error}`);
      return false;
    }
  };

  const testWebSocket = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      try {
        // Use secure WebSocket for HTTPS pages, insecure for HTTP
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.hostname}:8082`;
        addLog(`Attempting WebSocket connection to: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
          addLog('WebSocket connection timeout');
          ws.close();
          resolve(false);
        }, 3000);
        
        ws.onopen = () => {
          addLog('WebSocket connection successful');
          clearTimeout(timeout);
          ws.close();
          resolve(true);
        };
        
        ws.onerror = (error) => {
          addLog(`WebSocket error: ${error}`);
          clearTimeout(timeout);
          resolve(false);
        };
        
        ws.onclose = (event) => {
          addLog(`WebSocket closed: ${event.code} ${event.reason}`);
        };
      } catch (error) {
        addLog(`WebSocket test exception: ${error}`);
        resolve(false);
      }
    });
  };

  const testCSPHeaders = async (): Promise<boolean> => {
    try {
      const response = await fetch(window.location.origin);
      const csp = response.headers.get('content-security-policy');
      return csp !== null && csp.includes('shopify.com');
    } catch (error) {
      return false;
    }
  };

  const runAllTests = async () => {
    setTestResults({});
    setLogs([]);
    
    await runTest('URL Parameters', async () => {
      const shop = searchParams.get('shop');
      const host = searchParams.get('host');
      addLog(`Shop: ${shop}, Host: ${host}`);
      return !!(shop || host);
    });

    await runTest('Embedding Detection', async () => {
      addLog(`Is Embedded: ${isEmbedded}`);
      return isEmbedded;
    });

    await runTest('App Bridge Initialization', testAppBridge);
    await runTest('WebSocket Connection', testWebSocket);
    await runTest('CSP Headers', testCSPHeaders);

    await runTest('Frame Ancestors', async () => {
      try {
        return window.self !== window.top;
      } catch (error) {
        return true; // If we can't access parent, we're likely in an iframe
      }
    });
  };

  useEffect(() => {
    if (!loading) {
      runAllTests();
    }
  }, [loading, app]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Partner Platform Test</h1>
          <p className="text-muted-foreground">
            Validate Shopify Partner Platform integration
          </p>
        </div>
        <Badge variant={isEmbedded ? "default" : "secondary"}>
          {isEmbedded ? "Embedded" : "Standalone"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
            <CardDescription>Current runtime details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="font-medium">URL:</span>
              <span className="text-muted-foreground break-all">{window.location.href}</span>
              
              <span className="font-medium">Origin:</span>
              <span className="text-muted-foreground">{window.location.origin}</span>
              
              <span className="font-medium">User Agent:</span>
              <span className="text-muted-foreground">{navigator.userAgent.substring(0, 50)}...</span>
              
              <span className="font-medium">Shop:</span>
              <span className="text-muted-foreground">{searchParams.get('shop') || 'None'}</span>
              
              <span className="font-medium">Host:</span>
              <span className="text-muted-foreground">{searchParams.get('host') || 'None'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Partner Platform compatibility tests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test} className="flex justify-between items-center">
                <span className="text-sm">{test}</span>
                <Badge variant={result ? "default" : "destructive"}>
                  {result ? "PASS" : "FAIL"}
                </Badge>
              </div>
            ))}
            {Object.keys(testResults).length === 0 && (
              <p className="text-muted-foreground text-sm">Running tests...</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Logs</CardTitle>
          <CardDescription>Detailed test execution logs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-sm">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-xs font-mono mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button onClick={runAllTests} className="w-full">
          Re-run All Tests
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.open('/preferences?shop=test-store.myshopify.com&host=dGVzdC1zdG9yZS5teXNob3BpZnkuY29tL2FkbWlu', '_blank')}
          className="w-full"
        >
          Test Preferences (Embedded)
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.open('/partner-platform-test?shop=test-store.myshopify.com&host=dGVzdC1zdG9yZS5teXNob3BpZnkuY29tL2FkbWlu', '_blank')}
          className="w-full"
        >
          Test Embedded Context
        </Button>
        <Button 
          variant="outline" 
          onClick={() => window.open('/auth/callback?test=true&shop=test-store.myshopify.com', '_blank')}
          className="w-full"
        >
          Test OAuth Callback
        </Button>
      </div>

      <Alert>
        <AlertDescription>
          <strong>Partner Platform URLs:</strong> Make sure these URLs are configured in your Shopify Partner Dashboard:
          <br />• App URL: {window.location.origin}/
          <br />• Preferences URL: {window.location.origin}/preferences
          <br />• Redirect URLs: {window.location.origin}/auth/callback, {window.location.origin}/auth/shopify/callback
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PartnerPlatformTest;