
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AutomationSettings from "@/components/AutomationSettings";
import N8nConnectionSetup from "@/components/N8nConnectionSetup";
import WebhookManager from "@/components/WebhookManager";
import { useAutomationRules } from "@/hooks/useAutomationRules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Play, Pause, TestTube } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const Automations = () => {
  const { rules, loading, toggleRule, testRule } = useAutomationRules();

  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Automations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure automated workflows and rules for returns processing
          </p>
        </div>
        
        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="rules">Rules</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            <TabsTrigger value="setup">Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-0">
            <div className="bg-background rounded-lg border p-6">
              <div className="flex items-center gap-2 mb-6">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h2 className="text-lg font-medium text-foreground">Automation Rules</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage automated rules for return processing and notifications
                  </p>
                </div>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted/50 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4 hover:bg-muted/5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <rule.icon className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-medium text-foreground">{rule.name}</h3>
                            <p className="text-sm text-muted-foreground">{rule.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline">{rule.type}</Badge>
                              {rule.triggers !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  {rule.triggers} triggers
                                </span>
                              )}
                              {rule.lastRun && (
                                <span className="text-xs text-muted-foreground">
                                  Last: {rule.lastRun}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => testRule(rule.id)}
                            disabled={!rule.active}
                            className="h-8 w-8 p-0"
                          >
                            <TestTube className="h-4 w-4" />
                          </Button>
                          <Switch
                            checked={rule.active}
                            onCheckedChange={(checked) => toggleRule(rule.id, checked)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-0">
            <WebhookManager />
          </TabsContent>

          <TabsContent value="setup" className="space-y-0">
            <N8nConnectionSetup />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Automations;
