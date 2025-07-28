
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SecurityDashboard from "@/components/SecurityDashboard";
import AppLayout from "@/components/AppLayout";

const Security = () => {
  return (
    <AppLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Security</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor security settings and access controls
          </p>
        </div>
        
        <div className="bg-background rounded-lg border p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-foreground">Security Overview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor security settings, access logs, and system integrity
            </p>
          </div>
          <SecurityDashboard />
        </div>
      </div>
    </AppLayout>
  );
};

export default Security;
