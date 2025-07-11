
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AutomationSettings from "@/components/AutomationSettings";
import AppLayout from "@/components/AppLayout";

const Automations = () => {
  return (
    <AppLayout 
      title="Automations" 
      description="Configure automated workflows and rules for returns processing"
    >
      <Card>
        <CardHeader>
          <CardTitle>Automation Rules</CardTitle>
          <CardDescription>
            Set up automated rules for return approvals, notifications, and AI processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AutomationSettings />
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Automations;
