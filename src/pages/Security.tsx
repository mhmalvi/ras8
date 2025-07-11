
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SecurityDashboard from "@/components/SecurityDashboard";
import AppLayout from "@/components/AppLayout";

const Security = () => {
  return (
    <AppLayout 
      title="Security" 
      description="Monitor security settings and access controls"
    >
      <Card>
        <CardHeader>
          <CardTitle>Security Overview</CardTitle>
          <CardDescription>
            Monitor security settings, access logs, and system integrity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SecurityDashboard />
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Security;
