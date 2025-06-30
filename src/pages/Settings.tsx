
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Bell, CreditCard, Settings as SettingsIcon, Zap, Crown, Star } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [currentPlan, setCurrentPlan] = useState("Growth");
  const [usageCount, setUsageCount] = useState(287);
  const [usageLimit] = useState(500);
  const [notifications, setNotifications] = useState({
    newReturns: true,
    aiSuggestions: true,
    usageAlerts: true,
    weeklyReport: false
  });
  const { toast } = useToast();

  const plans = [
    {
      name: "Starter",
      price: "$29",
      limit: "100 returns/month",
      features: ["Basic returns management", "Email notifications", "Basic analytics"],
      icon: Zap,
      color: "text-blue-600"
    },
    {
      name: "Growth",
      price: "$79",
      limit: "500 returns/month",
      features: ["Advanced AI suggestions", "Priority support", "Custom branding", "Advanced analytics"],
      icon: Star,
      color: "text-purple-600"
    },
    {
      name: "Pro",
      price: "$149",
      limit: "Unlimited returns",
      features: ["White-label solution", "API access", "Custom integrations", "Dedicated support"],
      icon: Crown,
      color: "text-amber-600"
    }
  ];

  const billingHistory = [
    { date: "2024-01-01", amount: "$79.00", status: "Paid", plan: "Growth" },
    { date: "2023-12-01", amount: "$79.00", status: "Paid", plan: "Growth" },
    { date: "2023-11-01", amount: "$29.00", status: "Paid", plan: "Starter" },
  ];

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "Settings updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const handlePlanUpgrade = (planName: string) => {
    toast({
      title: "Plan upgrade initiated",
      description: `Upgrading to ${planName} plan...`,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">RA</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
              <p className="text-sm text-slate-500">Manage your account and preferences</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {currentPlan} Plan
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="billing" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Billing
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="general" className="flex items-center gap-2">
                <SettingsIcon className="h-4 w-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                AI Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="billing" className="space-y-6">
              {/* Current Plan & Usage */}
              <Card>
                <CardHeader>
                  <CardTitle>Current Plan & Usage</CardTitle>
                  <CardDescription>
                    Monitor your current plan and usage statistics
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{currentPlan} Plan</h3>
                      <p className="text-slate-600">Up to {plans.find(p => p.name === currentPlan)?.limit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{plans.find(p => p.name === currentPlan)?.price}</p>
                      <p className="text-sm text-slate-500">per month</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Returns processed this month</span>
                      <span>{usageCount} / {usageLimit}</span>
                    </div>
                    <Progress value={(usageCount / usageLimit) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              {/* Available Plans */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Plans</CardTitle>
                  <CardDescription>
                    Choose the plan that best fits your needs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {plans.map((plan) => {
                      const Icon = plan.icon;
                      const isCurrent = plan.name === currentPlan;
                      
                      return (
                        <Card key={plan.name} className={`relative ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}>
                          <CardHeader className="text-center">
                            <Icon className={`h-8 w-8 mx-auto ${plan.color}`} />
                            <CardTitle className="flex items-center justify-center gap-2">
                              {plan.name}
                              {isCurrent && <Badge variant="secondary">Current</Badge>}
                            </CardTitle>
                            <div className="text-2xl font-bold">{plan.price}</div>
                            <p className="text-sm text-slate-600">{plan.limit}</p>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                            {!isCurrent && (
                              <Button 
                                className="w-full" 
                                variant={plan.name === "Pro" ? "default" : "outline"}
                                onClick={() => handlePlanUpgrade(plan.name)}
                              >
                                Upgrade to {plan.name}
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Billing History */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                  <CardDescription>
                    View your past invoices and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {billingHistory.map((invoice, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{invoice.plan} Plan</p>
                          <p className="text-sm text-slate-500">{invoice.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{invoice.amount}</p>
                          <Badge variant={invoice.status === "Paid" ? "default" : "secondary"}>
                            {invoice.status}
                          </Badge>
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
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Choose what notifications you'd like to receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">New return requests</Label>
                        <p className="text-sm text-slate-500">Get notified when customers submit new returns</p>
                      </div>
                      <Switch 
                        checked={notifications.newReturns}
                        onCheckedChange={(checked) => handleNotificationChange('newReturns', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">AI suggestions</Label>
                        <p className="text-sm text-slate-500">Receive alerts about AI-generated exchange recommendations</p>
                      </div>
                      <Switch 
                        checked={notifications.aiSuggestions}
                        onCheckedChange={(checked) => handleNotificationChange('aiSuggestions', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Usage alerts</Label>
                        <p className="text-sm text-slate-500">Get warned when approaching plan limits</p>
                      </div>
                      <Switch 
                        checked={notifications.usageAlerts}
                        onCheckedChange={(checked) => handleNotificationChange('usageAlerts', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Weekly reports</Label>
                        <p className="text-sm text-slate-500">Receive weekly summary reports via email</p>
                      </div>
                      <Switch 
                        checked={notifications.weeklyReport}
                        onCheckedChange={(checked) => handleNotificationChange('weeklyReport', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="general" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure your store settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="store-name">Store Name</Label>
                      <Input id="store-name" defaultValue="John's Store" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contact-email">Contact Email</Label>
                      <Input id="contact-email" type="email" defaultValue="john@store.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="return-window">Return Window (days)</Label>
                      <Select defaultValue="30">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="14">14 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="60">60 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="auto-approve">Auto-approve threshold</Label>
                      <Select defaultValue="50">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">$25</SelectItem>
                          <SelectItem value="50">$50</SelectItem>
                          <SelectItem value="100">$100</SelectItem>
                          <SelectItem value="0">Disabled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Configuration</CardTitle>
                  <CardDescription>
                    Customize AI behavior and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Enable AI suggestions</Label>
                        <p className="text-sm text-slate-500">Allow AI to suggest exchange alternatives</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Minimum confidence threshold</Label>
                      <Select defaultValue="75">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">60%</SelectItem>
                          <SelectItem value="75">75%</SelectItem>
                          <SelectItem value="85">85%</SelectItem>
                          <SelectItem value="95">95%</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-slate-500">Only show AI suggestions above this confidence level</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Auto-apply high confidence suggestions</Label>
                        <p className="text-sm text-slate-500">Automatically apply suggestions with 95%+ confidence</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Settings;
