import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Shield, Bell, Database, Key, Globe, Users, Save } from "lucide-react";

const SettingsTab = () => {
  const systemSettings = {
    maintenance_mode: false,
    debug_logging: true,
    auto_backups: true,
    email_notifications: true,
    api_rate_limiting: true,
    security_monitoring: true,
  };

  const apiKeys = [
    { name: 'OpenAI API Key', status: 'active', lastUsed: '2 minutes ago', masked: 'sk-...abc123' },
    { name: 'Stripe Secret Key', status: 'active', lastUsed: '1 hour ago', masked: 'sk_live_...xyz789' },
    { name: 'Shopify App Secret', status: 'active', lastUsed: '30 minutes ago', masked: 'shpss_...def456' },
  ];

  const securitySettings = {
    two_factor_auth: true,
    session_timeout: '4 hours',
    password_policy: 'strong',
    login_attempts: 5,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
        <p className="text-slate-600">Configure system-wide settings and preferences</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription>
                Configure general system settings and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Maintenance Mode</h4>
                      <p className="text-sm text-slate-600">Put system in maintenance mode</p>
                    </div>
                    <Switch checked={systemSettings.maintenance_mode} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Debug Logging</h4>
                      <p className="text-sm text-slate-600">Enable detailed debug logs</p>
                    </div>
                    <Switch checked={systemSettings.debug_logging} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Auto Backups</h4>
                      <p className="text-sm text-slate-600">Automatic daily database backups</p>
                    </div>
                    <Switch checked={systemSettings.auto_backups} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-slate-600">Send system email notifications</p>
                    </div>
                    <Switch checked={systemSettings.email_notifications} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">API Rate Limiting</h4>
                      <p className="text-sm text-slate-600">Enforce API rate limits</p>
                    </div>
                    <Switch checked={systemSettings.api_rate_limiting} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Security Monitoring</h4>
                      <p className="text-sm text-slate-600">Monitor security events</p>
                    </div>
                    <Switch checked={systemSettings.security_monitoring} />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={() => {
                  console.log('💾 Saving general settings...');
                  // Show feedback to user
                  // In a real implementation, this would save to Supabase
                }}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                Manage security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Session Timeout</label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option>1 hour</option>
                      <option>2 hours</option>
                      <option selected>4 hours</option>
                      <option>8 hours</option>
                      <option>24 hours</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Password Policy</label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option>Basic</option>
                      <option>Medium</option>
                      <option selected>Strong</option>
                      <option>Ultra Strong</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Max Login Attempts</label>
                    <select className="w-full mt-1 px-3 py-2 border rounded-md">
                      <option>3</option>
                      <option selected>5</option>
                      <option>10</option>
                      <option>Unlimited</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Two-Factor Authentication</h4>
                      <p className="text-sm text-slate-600">Require 2FA for admin users</p>
                    </div>
                    <Switch checked={securitySettings.two_factor_auth} />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button onClick={() => {
                  console.log('🔐 Updating security settings...');
                  // Show feedback to user
                  // In a real implementation, this would save to Supabase
                }}>
                  <Save className="h-4 w-4 mr-2" />
                  Update Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Key Management
              </CardTitle>
              <CardDescription>
                Manage API keys and external service integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiKeys.map((apiKey, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{apiKey.name}</h4>
                      <p className="text-sm text-slate-600 font-mono">{apiKey.masked}</p>
                      <p className="text-xs text-slate-500">Last used: {apiKey.lastUsed}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="text-green-600 bg-green-100">
                        {apiKey.status}
                      </Badge>
                      <Button variant="outline" size="sm" onClick={() => {
                        console.log(`🔑 Updating ${apiKey.name}...`);
                        // Show modal for API key update
                      }}>
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure system notifications and alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">System Alerts</h4>
                    <p className="text-sm text-slate-600">Critical system alerts and errors</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Performance Warnings</h4>
                    <p className="text-sm text-slate-600">Performance degradation alerts</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Security Events</h4>
                    <p className="text-sm text-slate-600">Security-related notifications</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Backup Notifications</h4>
                    <p className="text-sm text-slate-600">Database backup status updates</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Settings
              </CardTitle>
              <CardDescription>
                Database configuration and maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Connection Pool</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Min Connections:</span>
                        <span>5</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Max Connections:</span>
                        <span>100</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Current Active:</span>
                        <span>23</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Backup Schedule</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Frequency:</span>
                        <span>Daily at 2:00 AM</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Retention:</span>
                        <span>30 days</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Last Backup:</span>
                        <span>2 hours ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t flex gap-3">
                <Button onClick={() => {
                  console.log('🗄️ Running manual backup...');
                  // Show progress and feedback
                }}>
                  <Database className="h-4 w-4 mr-2" />
                  Run Manual Backup
                </Button>
                <Button variant="outline" onClick={() => {
                  console.log('📜 Viewing backup history...');
                  // Show backup history modal or navigate to history page
                }}>
                  View Backup History
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsTab;