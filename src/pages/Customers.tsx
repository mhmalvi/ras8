
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/LoadingStates";

const Customers = () => {
  return (
    <AppLayout 
      title="Customers" 
      description="View and manage customer information and return history"
    >
      <Card>
        <CardHeader>
          <CardTitle>Customer Management</CardTitle>
          <CardDescription>
            Track customer return patterns and communication history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LoadingSpinner text="Customer data loading..." />
            <p className="text-muted-foreground mt-4">
              Customer management features are being prepared for you.
            </p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Customers;
