import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import WebhookManager from "@/components/WebhookManager";
import { Zap, Bot, Mail, Clock, Webhook, Settings } from "lucide-react";
import { useAutomationRules } from '@/hooks/useAutomationRules';
import AutomationRuleCard from '@/components/AutomationRuleCard';

const Automations = () => {
  const {
    rules,
    loading,
    toggleRule,
    testRule,
    configureRule
  } = useAutomationRules();

  const n8nWorkflows = [
    {
      id: "wf1",
      name: "Return Processing Workflow",
      description: "Automated return approval and notification system",
      status: "active",
      lastRun: "2 hours ago",
      triggers: 156
    },
    {
      id: "wf2", 
      name: "Customer Retention Campaign",
      description: "Win-back email campaigns for inactive customers",
      status: "active",
      lastRun: "1 day ago",
      triggers: 23
    },
    {
      id: "wf3",
      name: "Shopify Order Sync",
      description: "Sync new orders from Shopify for return eligibility",
      status: "active",
      lastRun: "5 minutes ago",
      triggers: 1247
    }
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <SidebarInset>
          <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-40">
            <div className="flex items-center space-x-4">
              <SidebarTrigger />
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Automations</h1>
                <p className="text-sm text-slate-500">Manage automated workflows and integrations</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <Tabs defaultValue="rules" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="rules">Automation Rules</TabsTrigger>
                  <TabsTrigger value="webhooks">Webhook Management</TabsTrigger>
                  <TabsTrigger value="workflows">N8n Workflows</TabsTrigger>
                </TabsList>

                <TabsContent value="rules" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Automation Rules</CardTitle>
                      <CardDescription>
                        Configure automated processes to streamline your returns management
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <div className="grid gap-6">
                    {rules.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center py-8 text-muted-foreground">
                            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No automation rules configured yet</p>
                            <p className="text-sm">Rules will be automatically loaded from your configuration</p>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      rules.map((rule) => (
                        <AutomationRuleCard
                          key={rule.id}
                          rule={rule}
                          onToggle={toggleRule}
                          onConfigure={configureRule}
                          onTest={testRule}
                          loading={loading}
                        />
                      ))
                    )}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Create New Automation</CardTitle>
                      <CardDescription>Set up custom automation rules for your specific needs</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full sm:w-auto" disabled>
                        <Zap className="h-4 w-4 mr-2" />
                        Create Automation (Coming Soon)
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="webhooks">
                  <WebhookManager />
                </TabsContent>

                <TabsContent value="workflows" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        N8n Workflows
                      </CardTitle>
                      <CardDescription>
                        Monitor and manage your n8n automation workflows
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <div className="grid gap-6">
                    {n8nWorkflows.map((workflow) => (
                      <Card key={workflow.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{workflow.name}</h3>
                                <Badge variant={workflow.status === 'active' ? 'default' : 'secondary'}>
                                  {workflow.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{workflow.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Last run: {workflow.lastRun}</span>
                                <span>Total triggers: {workflow.triggers}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                View Logs
                              </Button>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Workflow Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">1,426</div>
                          <div className="text-sm text-green-600">Total Executions</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">98.5%</div>
                          <div className="text-sm text-blue-600">Success Rate</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">3</div>
                          <div className="text-sm text-purple-600">Active Workflows</div>
                        </div>
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

export default Automations;
