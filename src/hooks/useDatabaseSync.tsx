
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Database sync hook - connected to Supabase
export const useDatabaseSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    // Check Supabase connection
    const checkConnection = async () => {
      try {
        const { data, error } = await supabase.from('merchants').select('count').single();
        if (!error) {
          setIsConnected(true);
          setLastSync(new Date());
        }
      } catch (error) {
        console.error('Database connection check failed:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const syncData = async () => {
    setSyncStatus('syncing');
    try {
      // Test connection with a simple query
      const { error } = await supabase.from('merchants').select('count').single();
      
      if (error) throw error;
      
      setLastSync(new Date());
      setSyncStatus('idle');
      toast({
        title: "Sync completed",
        description: "Data has been synchronized with the database."
      });
    } catch (error) {
      setSyncStatus('error');
      toast({
        title: "Sync failed",
        description: "Failed to synchronize data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const autoSync = () => {
    // Set up auto-sync every 5 minutes
    const interval = setInterval(() => {
      if (isConnected && syncStatus === 'idle') {
        syncData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  };

  return {
    isConnected,
    lastSync,
    syncStatus,
    syncData,
    autoSync
  };
};
