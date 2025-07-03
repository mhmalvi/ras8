
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailNotificationSettings from "@/components/EmailNotificationSettings";
import { Settings as SettingsIcon, Mail, Shield, Zap } from "lucide-react";

const Settings = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
                <p className="text-sm text-slate-500">Configure your returns automation platform</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-4xl mx-auto">
              <Tabs defaultValue="notifications" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="notifications" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Notifications
                  </TabsTrigger>
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <SettingsIcon className="h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Security
                  </TabsTrigger>
                  <TabsTrigger value="automation" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Automation
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="notifications">
                  <EmailNotificationSettings />
                </TabsContent>

                <TabsContent value="general">
                  <Card>
                    <CardHeader>
                      <CardTitle>General Settings</CardTitle>
                      <CardDescription>
                        Basic configuration for your returns platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          General settings will be available in the next update.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="security">
                  <Card>
                    <CardHeader>
                      <CardTitle>Security Settings</CardTitle>
                      <CardDescription>
                        Manage security and access controls
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Security settings will be available in the next update.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="automation">
                  <Card>
                    <CardHeader>
                      <CardTitle>Automation Settings</CardTitle>
                      <CardDescription>
                        Configure AI and workflow automations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Automation settings will be available in the next update.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
