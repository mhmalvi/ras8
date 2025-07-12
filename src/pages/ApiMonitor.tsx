
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { Activity, Shield, AlertTriangle } from "lucide-react";

const ApiMonitorPage = () => {
  return (
    <AppLayout 
      title="📊 API Monitor" 
      description="API monitoring and performance metrics (Master Admin Only)"
    >
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-5 w-5" />
              Master Admin Access Required
            </CardTitle>
            <CardDescription className="text-yellow-700">
              API monitoring provides system-wide metrics and is restricted to master administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">API monitoring requires elevated privileges</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              API monitoring dashboard coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ApiMonitorPage;
