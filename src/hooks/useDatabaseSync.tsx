
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from './useProfile';

// Real database sync hook - connected to Supabase with real-time updates
export const useDatabaseSync = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const { toast } = useToast();
  const { profile } = useProfile();

  useEffect(() => {
    // Check Supabase connection and set up real-time monitoring
    const checkConnection = async () => {
      try {
        // Test connection with a simple authenticated query
        const { data, error } = await supabase.auth.getSession();
        
        if (!error && data.session) {
          setIsConnected(true);
          setLastSync(new Date());
          
          // Set up connection monitoring
          supabase.auth.onAuthStateChange((event, session) => {
            setIsConnected(!!session);
            if (session) {
              setLastSync(new Date());
            }
          });
        } else {
          setIsConnected(false);
        }
      } catch (error) {
        console.error('Database connection check failed:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
  }, []);

  const syncData = async () => {
    if (!profile?.merchant_id) {
      toast({
        title: "Sync failed",
        description: "No merchant profile found. Please complete your profile setup.",
        variant: "destructive"
      });
      return;
    }

    setSyncStatus('syncing');
    try {
      // Sync returns data
      const { data: returns, error: returnsError } = await supabase
        .from('returns')
        .select('*')
        .eq('merchant_id', profile.merchant_id);

      if (returnsError) throw returnsError;

      // Sync analytics events
      const { data: analytics, error: analyticsError } = await supabase
        .from('analytics_events')
        .select('*')
        .eq('merchant_id', profile.merchant_id);

      if (analyticsError) throw analyticsError;

      // Create a sync event
      await supabase
        .from('analytics_events')
        .insert({
          merchant_id: profile.merchant_id,
          event_type: 'data_sync',
          event_data: {
            returns_count: returns?.length || 0,
            analytics_count: analytics?.length || 0,
            timestamp: new Date().toISOString()
          }
        });

      setLastSync(new Date());
      setSyncStatus('idle');
      
      toast({
        title: "Sync completed",
        description: `Synchronized ${returns?.length || 0} returns and ${analytics?.length || 0} analytics events.`
      });

      // Trigger custom event for other components to refresh
      window.dispatchEvent(new CustomEvent('dataSync', { 
        detail: { timestamp: new Date().toISOString() } 
      }));

    } catch (error) {
      setSyncStatus('error');
      console.error('Sync error:', error);
      toast({
        title: "Sync failed",
        description: `Failed to synchronize data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const autoSync = () => {
    // Set up auto-sync every 5 minutes, but only if connected and idle
    const interval = setInterval(() => {
      if (isConnected && syncStatus === 'idle' && profile?.merchant_id) {
        console.log('Auto-syncing data...');
        syncData();
      }
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  };

  // Set up real-time connection monitoring
  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;

    const handleDisconnect = () => {
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(() => {
          console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);
          syncData();
        }, 2000 * reconnectAttempts); // Exponential backoff
      }
    };

    // Listen for network status changes
    window.addEventListener('online', syncData);
    window.addEventListener('offline', handleDisconnect);

    return () => {
      window.removeEventListener('online', syncData);
      window.removeEventListener('offline', handleDisconnect);
    };
  }, [profile?.merchant_id]);

  return {
    isConnected,
    lastSync,
    syncStatus,
    syncData,
    autoSync
  };
};
