
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const ProfileCreator = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkProfileExists();
  }, [user]);

  const checkProfileExists = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking profile:', error);
        return;
      }

      setProfileExists(!!data);
      console.log('Profile exists:', !!data);
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };

  const createProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          first_name: user.user_metadata?.first_name || null,
          last_name: user.user_metadata?.last_name || null,
          role: 'admin'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      console.log('Profile created successfully:', data);
      setProfileExists(true);
      
      toast({
        title: "Profile created successfully!",
        description: "You can now use the merchant assignment feature.",
      });
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error creating profile",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (profileExists === null) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Checking profile...</span>
      </div>
    );
  }

  if (profileExists) {
    return null; // Profile exists, no need to show this component
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create Profile
        </CardTitle>
        <CardDescription>
          Your profile needs to be created before you can access merchant data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Profile Missing:</strong> A profile record is required to access the dashboard and assign merchants.
          </AlertDescription>
        </Alert>

        <Button 
          onClick={createProfile}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Profile...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Create Profile
            </>
          )}
        </Button>
        
        <div className="text-xs text-slate-500">
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileCreator;
