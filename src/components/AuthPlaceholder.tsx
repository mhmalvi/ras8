
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Database, Key } from "lucide-react";

const AuthPlaceholder = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle>Authentication Required</CardTitle>
          <CardDescription>
            To implement secure login and signup functionality, this app needs to be connected to Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <Database className="h-5 w-5 text-slate-600" />
              <div>
                <div className="font-medium text-sm">Database Integration</div>
                <div className="text-xs text-slate-500">Secure user data storage</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
              <Key className="h-5 w-5 text-slate-600" />
              <div>
                <div className="font-medium text-sm">JWT Authentication</div>
                <div className="text-xs text-slate-500">Secure session management</div>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-slate-600 mb-4">
              Click the green Supabase button in the top right to get started with authentication.
            </p>
            <Button className="w-full" disabled>
              Authentication Setup Required
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthPlaceholder;
