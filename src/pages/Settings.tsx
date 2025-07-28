
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Shield, CreditCard, Bell } from "lucide-react";
import SystemSetup from "@/components/SystemSetup";
import SubscriptionStatus from "@/components/SubscriptionStatus";
import EmailNotificationSettings from "@/components/EmailNotificationSettings";
import AppLayout from "@/components/AppLayout";
import { cn } from "@/lib/utils";

const Settings = () => {
  const [activeTab, setActiveTab] = useState('system');

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="animate-fade-in">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Configure your store settings and preferences
            </p>
            <Separator className="mt-4" />
          </div>
          
          {/* Settings Tabs */}
          <section className="animate-fade-in">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList className="grid w-full grid-cols-3 max-w-md h-12">
                <TabsTrigger 
                  value="system" 
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:block">System</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="subscription" 
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:block">Plan</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notifications"
                  className="flex items-center space-x-2 transition-all duration-200"
                >
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:block">Notifications</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="system" className="space-y-0">
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <span>System Configuration</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Configure your Shopify integration and system settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SystemSetup />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="subscription" className="space-y-0">
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <span>Subscription Management</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Manage your plan and billing information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SubscriptionStatus />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="notifications" className="space-y-0">
                <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-foreground">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <span>Notification Settings</span>
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Configure email notifications and alerts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <EmailNotificationSettings />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
