
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { MessageSquare, Shield, AlertTriangle } from "lucide-react";

const SupportCenterPage = () => {
  return (
    <AppLayout 
      title="🎧 Support Center" 
      description="Customer support management (Master Admin Only)"
    >
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-5 w-5" />
              Master Admin Access Required
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Support center management provides access to all customer communications and is restricted to master administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">Support management requires elevated privileges</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Support Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Support center interface coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default SupportCenterPage;
