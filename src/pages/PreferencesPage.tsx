import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppBridge } from '@/components/AppBridgeProvider';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PreferencesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isEmbedded } = useAppBridge();
  const shop = searchParams.get('shop');

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">App Preferences</h1>
            <p className="text-muted-foreground">
              Configure your H5 Returns Management settings
            </p>
          </div>
          <Badge variant={isEmbedded ? "default" : "secondary"}>
            {isEmbedded ? "Embedded" : "Standalone"}
          </Badge>
        </div>

        {shop && (
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Connected Shopify store details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Shop Domain:</span>
                  <span className="text-muted-foreground">{shop}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">App Status:</span>
                  <Badge variant="outline" className="text-green-600">Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Return Processing</CardTitle>
              <CardDescription>Configure how returns are handled</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Auto-approval for exchanges</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Email notifications</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Return window (days)</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Features</CardTitle>
              <CardDescription>Automated returns processing options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>AI-powered approval</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Smart categorization</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Fraud detection</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer Experience</CardTitle>
              <CardDescription>Return portal customization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Custom branding</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Return reasons</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Upload requirements</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
              <CardDescription>Connect with other services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Shipping providers</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Accounting systems</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
              <div className="flex items-center justify-between">
                <span>Customer service</span>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Advanced Settings</CardTitle>
            <CardDescription>Technical and security configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline">Webhook Settings</Button>
              <Button variant="outline">API Configuration</Button>
              <Button variant="outline">Data Export</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default PreferencesPage;