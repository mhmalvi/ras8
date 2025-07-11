
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2 } from "lucide-react";
const DatabaseSyncButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setIsLoading(true);
    
    try {
      // Refresh page to reload all data from database
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
      toast({
        title: "Refreshing Data",
        description: "Reloading all data from database...",
      });
    } catch (error) {
      toast({
        title: "Refresh Error",
        description: "An error occurred while refreshing data.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleRefresh} 
      disabled={isLoading}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isLoading ? 'Refreshing...' : 'Refresh Data'}
    </Button>
  );
};

export default DatabaseSyncButton;
