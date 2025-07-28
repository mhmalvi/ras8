import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Settings, CheckCircle } from "lucide-react";
import SystemSetup from "@/components/SystemSetup";
import EmailNotificationSettings from "@/components/EmailNotificationSettings";

const SystemPreferences = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-2xl font-semibold">System Preferences</h2>
          <p className="text-muted-foreground">Manage system settings, notifications, and health monitoring</p>
        </div>
      </div>

      <div className="space-y-8">
        {/* System Health Section */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">System Health</h3>
          </div>
          <SystemSetup />
        </div>

        <Separator />

        {/* Email Notifications Section */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Email Notifications</h3>
          </div>
          <EmailNotificationSettings />
        </div>

        <Separator />

        {/* Additional Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>General Preferences</span>
            </CardTitle>
            <CardDescription>
              Configure general application preferences and behavior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Additional Preferences</h3>
              <p className="text-muted-foreground">
                Timezone, language, and other general preferences will be available here.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemPreferences;