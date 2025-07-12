
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { UserCog, Shield, AlertTriangle } from "lucide-react";

const UserManagementPage = () => {
  return (
    <AppLayout 
      title="👥 User Management" 
      description="System-wide user administration (Master Admin Only)"
    >
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Shield className="h-5 w-5" />
              Master Admin Access Required
            </CardTitle>
            <CardDescription className="text-yellow-700">
              User management provides control over all system users and is restricted to master administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">User management requires elevated privileges</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" />
              User Administration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              User management interface coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UserManagementPage;
