
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AppLayout from "@/components/AppLayout";
import { LoadingSpinner } from "@/components/LoadingStates";

const Products = () => {
  return (
    <AppLayout 
      title="Products" 
      description="Manage products and return eligibility settings"
    >
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
          <CardDescription>
            Configure product return policies and track return rates by product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <LoadingSpinner text="Product data loading..." />
            <p className="text-muted-foreground mt-4">
              Product management features are being prepared for you.
            </p>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Products;
