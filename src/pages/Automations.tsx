
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Zap, Bot, Mail, Clock } from "lucide-react";

const Automations = () => {
  const automations = [
    {
      id: "1",
      name: "Auto-approve returns under $50",
      description: "Automatically approve return requests for orders under $50",
      icon: Zap,
      active: true,
      type: "Rule-based"
    },
    {
      id: "2",
      name: "AI-powered exchange suggestions",
      description: "Use AI to suggest relevant exchange items to customers",
      icon: Bot,
      active: true,
      type: "AI-powered"
    },
    {
      id: "3",
      name: "Return confirmation emails",
      description: "Send automatic confirmation emails when returns are processed",
      icon: Mail,
      active: false,
      type: "Communication"
    },
    {
      id: "4",
      name: "Follow-up reminders",
      description: "Send reminders for pending return actions after 24 hours",
      icon: Clock,
      active: true,
      type: "Time-based"
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
                <p className="text-sm text-slate-500">Manage automated workflows and rules</p>
              </div>
            </div>
          </header>

          <main className="px-6 py-8">
            <div className="max-w-7xl mx-auto">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Automation Overview</CardTitle>
                  <CardDescription>Configure automated processes to streamline your returns management</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-6">
                {automations.map((automation) => {
                  const Icon = automation.icon;
                  return (
                    <Card key={automation.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Icon className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{automation.name}</h3>
                              <p className="text-sm text-slate-500">{automation.description}</p>
                              <div className="mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {automation.type}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Switch checked={automation.active} />
                            <Button variant="outline" size="sm">
                              Configure
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Create New Automation</CardTitle>
                  <CardDescription>Set up custom automation rules for your specific needs</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full sm:w-auto">
                    <Zap className="h-4 w-4 mr-2" />
                    Create Automation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Automations;
