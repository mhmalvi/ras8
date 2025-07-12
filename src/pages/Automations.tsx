
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AutomationSettings from "@/components/AutomationSettings";
import N8nConnectionSetup from "@/components/N8nConnectionSetup";
import { useAutomationRules } from "@/hooks/useAutomationRules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Settings, Play, Pause, TestTube } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const Automations = () => {
  const { rules, loading, toggleRule, testRule } = useAutomationRules();

  return (
    <AppLayout 
      title="Automations" 
      description="Configure automated workflows and rules for returns processing"
    >
      <Tabs defaultValue="rules" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="rules">Automation Rules</TabsTrigger>
          <TabsTrigger value="setup">n8n Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Automation Rules
              </CardTitle>
              <CardDescription>
                Manage automated rules for return processing, approvals, and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-muted rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {rules.map((rule) => (
                    <div key={rule.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <rule.icon className="h-5 w-5 text-primary" />
                          <div>
                            <h3 className="font-medium">{rule.name}</h3>
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
                                  Last run: {rule.lastRun}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testRule(rule.id)}
                            disabled={!rule.active}
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="setup">
          <N8nConnectionSetup />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default Automations;
