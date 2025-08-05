import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAutomationRules } from "@/hooks/useAutomationRules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Activity, 
  Play, 
  Pause, 
  TestTube, 
  BarChart3, 
  Settings, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  ArrowRight
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Link } from "react-router-dom";

const Automations = () => {
  const { rules, loading, toggleRule, testRule } = useAutomationRules();

  // Mock data for demonstration
  const automationStats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.active).length,
    totalTriggers: 156,
    successRate: 94.2
  };

  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  Automation Management
                </h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Monitor and manage your active automation workflows and rules
              </p>
            </div>
            <Link to="/settings/automation">
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configure Setup
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Rules</p>
                  <p className="text-2xl font-bold">{automationStats.totalRules}</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold text-green-600">{automationStats.activeRules}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{automationStats.totalTriggers}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Zap className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold">{automationStats.successRate}%</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Setup Status Alert */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800">
                  Automation Setup Required
                </p>
                <p className="text-sm text-orange-700">
                  To use automations, you need to configure your n8n server connection first.
                </p>
              </div>
              <Link to="/settings/automation">
                <Button size="sm" variant="outline" className="flex items-center gap-2">
                  Setup Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Active Rules
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Active Automation Rules
                </CardTitle>
                <CardDescription>
                  Manage and monitor your currently active automation workflows
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      <div key={rule.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <rule.icon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="font-medium text-foreground">{rule.name}</h3>
                                <Badge variant={rule.active ? "default" : "secondary"}>
                                  {rule.active ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Badge variant="outline" className="text-xs">{rule.type}</Badge>
                                </span>
                                {rule.triggers !== undefined && (
                                  <span className="flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    {rule.triggers} triggers this month
                                  </span>
                                )}
                                {rule.lastRun && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Last run: {rule.lastRun}
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
                              className="h-9 w-9 p-0"
                              title="Test Rule"
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

          <TabsContent value="monitoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Monitoring
                </CardTitle>
                <CardDescription>
                  Track automation performance and execution metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Performance Analytics</h3>
                  <p className="text-sm">
                    Detailed monitoring charts and metrics will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Execution History
                </CardTitle>
                <CardDescription>
                  View past automation executions and their results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Execution History</h3>
                  <p className="text-sm">
                    Historical execution logs and results will be displayed here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Automations;