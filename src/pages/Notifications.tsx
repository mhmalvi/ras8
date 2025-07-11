
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/LoadingStates";

const Notifications = () => {
  return (
    <AppLayout 
      title="Notifications" 
      description="Manage notification settings and view recent alerts"
    >
      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
          <CardDescription>
            View recent notifications and configure alert preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LoadingSpinner text="Loading notifications..." />
            <p className="text-muted-foreground mt-4">
              Notification management features are being prepared for you.
            </p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Notifications;
</lov-actions>
