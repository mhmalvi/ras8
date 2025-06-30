
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Database, Loader2 } from "lucide-react";
import { syncSampleData } from "@/utils/databaseSync";

const DatabaseSyncButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSync = async () => {
    setIsLoading(true);
    
    try {
      const result = await syncSampleData();
      
      if (result.success) {
        toast({
          title: "Sync Successful",
          description: "Database has been synced with sample returns data.",
        });
      } else {
        toast({
          title: "Sync Failed",
          description: result.error || "Failed to sync database",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Error",
        description: "An unexpected error occurred during sync",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleSync} 
      disabled={isLoading}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isLoading ? 'Syncing...' : 'Sync Database'}
    </Button>
  );
};

export default DatabaseSyncButton;
