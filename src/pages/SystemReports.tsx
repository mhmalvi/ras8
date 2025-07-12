
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { FileText, Shield, AlertTriangle } from "lucide-react";

const SystemReportsPage = () => {
  return (
    <AppLayout 
      title="📈 System Reports" 
      description="System-wide analytics and reports (Master Admin Only)"
    >
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-5 w-5" />
              Master Admin Access Required
            </CardTitle>
            <CardDescription className="text-yellow-700">
              System reports provide comprehensive analytics across all tenants and are restricted to master administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">System reports require elevated privileges</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Analytics Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              System reports interface coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SystemReportsPage;
