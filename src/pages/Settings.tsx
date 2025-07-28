
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SystemSetup from "@/components/SystemSetup";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import EmailNotificationSettings from "@/components/EmailNotificationSettings";
import AppLayout from "@/components/AppLayout";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('system');

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your store settings and preferences
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="subscription">Plan</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="system" className="space-y-0">
            <div className="bg-background rounded-lg border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-foreground">System Configuration</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure your Shopify integration and system settings
                </p>
              </div>
              <SystemSetup />
            </div>
          </TabsContent>
          
          <TabsContent value="subscription" className="space-y-0">
            <div className="bg-background rounded-lg border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-foreground">Subscription Management</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your plan and billing information
                </p>
              </div>
              <SubscriptionStatus />
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-0">
            <div className="bg-background rounded-lg border p-6">
              <div className="mb-6">
                <h2 className="text-lg font-medium text-foreground">Notification Settings</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Configure email notifications and alerts
                </p>
              </div>
              <EmailNotificationSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
