
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        console.log('🔄 User authenticated, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } else {
        console.log('🔄 No user, redirecting to landing');
        navigate('/landing', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // Show loading while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-muted-foreground">Initializing application...</span>
      </div>
    </div>
  );
};

export default Index;
