import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { debugEnvironment, validateCriticalEnvVars } from '@/utils/envDebug';
import { generateOAuthUrl, validateShopDomain, ensureShopifyDomain } from '@/utils/shopifyInstallation';

const EnvironmentTest: React.FC = () => {
  const [testShop, setTestShop] = useState('test42434.myshopify.com');
  const [oauthUrl, setOauthUrl] = useState<string>('');
  const [error, setError] = useState<string>('');

  const envStatus = debugEnvironment();
  const { valid, missing } = validateCriticalEnvVars();

  const testOAuthGeneration = () => {
    try {
      setError('');
      if (!validateShopDomain(testShop)) {
        throw new Error('Invalid shop domain format');
      }
      
      const url = generateOAuthUrl(testShop);
      setOauthUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setOauthUrl('');
    }
  };

  const testPartnerPlatformUrls = () => {
    const baseUrl = 'https://ras-5.vercel.app';
    const urls = [
      `${baseUrl}/health`,
      `${baseUrl}/auth/callback?shop=${testShop}&code=test123`,
      `${baseUrl}/functions/v1/shopify-oauth-start?shop=${testShop}`,
      `${baseUrl}/preferences?shop=${testShop}`,
    ];

    urls.forEach(url => {
      window.open(url, '_blank');
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Environment & OAuth Test</h1>
          <p className="text-muted-foreground">
            Diagnose environment variables and OAuth configuration
          </p>
        </div>
        <Badge variant={valid ? "default" : "destructive"}>
          {valid ? "Environment OK" : "Environment Issues"}
        </Badge>
      </div>

      {/* Environment Variables Status */}
      <Card>
        <CardHeader>
          <CardTitle>Environment Variables</CardTitle>
          <CardDescription>Current environment variable status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {envStatus.map(({ name, value, present }) => (
              <div key={name} className="flex items-center justify-between">
                <span className="font-mono text-sm">{name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={present ? "default" : "destructive"}>
                    {present ? "✅ Set" : "❌ Missing"}
                  </Badge>
                  <span className="text-xs text-muted-foreground max-w-xs truncate">
                    {present ? value : 'Not configured'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {!valid && (
            <Alert className="mt-4">
              <AlertDescription>
                <strong>Missing critical variables:</strong> {missing.join(', ')}
                <br />Check your .env.local file and restart the dev server.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* OAuth URL Generation Test */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth URL Generation</CardTitle>
          <CardDescription>Test OAuth URL generation with your shop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="shop-name.myshopify.com"
              value={testShop}
              onChange={(e) => setTestShop(e.target.value)}
              className="flex-1"
            />
            <Button onClick={testOAuthGeneration} disabled={!valid}>
              Generate OAuth URL
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {oauthUrl && (
            <div className="space-y-2">
              <h4 className="font-medium">Generated OAuth URL:</h4>
              <div className="bg-muted p-3 rounded text-sm font-mono break-all">
                {oauthUrl}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(oauthUrl)}
                >
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(oauthUrl, '_blank')}
                >
                  Test OAuth Flow
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Platform URLs Test */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Platform URLs</CardTitle>
          <CardDescription>Test all configured Partner Platform endpoints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>App URL:</strong>
              <br />https://ras-5.vercel.app/
            </div>
            <div>
              <strong>Preferences URL:</strong>
              <br />https://ras-5.vercel.app/preferences
            </div>
            <div>
              <strong>OAuth Callback:</strong>
              <br />https://ras-5.vercel.app/functions/v1/shopify-oauth-callback
            </div>
            <div>
              <strong>OAuth Start:</strong>
              <br />https://ras-5.vercel.app/functions/v1/shopify-oauth-start
            </div>
          </div>

          <Button onClick={testPartnerPlatformUrls} className="w-full">
            Test All Partner Platform URLs
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common testing scenarios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('/partner-platform-test', '_blank')}
            >
              Run Platform Tests
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(`/shopify/install?shop=${testShop}`, '_blank')}
            >
              Test Installation Flow
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Reload Environment
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current runtime details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="font-medium">Mode:</span>
            <span>{import.meta.env.MODE}</span>
            
            <span className="font-medium">Dev:</span>
            <span>{import.meta.env.DEV ? 'Yes' : 'No'}</span>
            
            <span className="font-medium">Base URL:</span>
            <span>{import.meta.env.BASE_URL}</span>
            
            <span className="font-medium">Current URL:</span>
            <span className="break-all">{window.location.href}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnvironmentTest;