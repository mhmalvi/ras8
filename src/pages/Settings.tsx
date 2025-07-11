
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SystemSetup from "@/components/SystemSetup";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import EmailNotificationSettings from "@/components/EmailNotificationSettings";
import AppLayout from "@/components/AppLayout";

const Settings = () => {
  return (
    <AppLayout 
      title="Settings" 
      description="Configure your store settings and preferences"
    >
      <div className="max-w-4xl mx-auto">
        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system">System Setup</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
                <CardDescription>
                  Configure your Shopify integration and system settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemSetup />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Management</CardTitle>
                <CardDescription>
                  Manage your plan and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubscriptionStatus />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Configure email notifications and alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EmailNotificationSettings />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Settings;
