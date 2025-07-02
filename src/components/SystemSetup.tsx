import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemCheck {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  critical: boolean;
}

const SystemSetup = () => {
  const [checks, setChecks] = useState<SystemCheck[]>([]);
  const [loading, setLoading] = useState(true);

  const runSystemChecks = async () => {
    const systemChecks: SystemCheck[] = [];

    // Check Supabase connection
    try {
      const { data, error } = await supabase.from('merchants').select('count').limit(1);
      if (error) throw error;
      systemChecks.push({
        name: 'Database Connection',
        status: 'success',
        message: 'Connected to Supabase successfully',
        critical: true
      });
    } catch (error) {
      systemChecks.push({
        name: 'Database Connection',
        status: 'error',
        message: 'Failed to connect to database',
        critical: true
      });
    }

    // Check AI Edge Function
    try {
      const { data, error } = await supabase.functions.invoke('generate-exchange-recommendation', {
        body: {
          returnReason: 'test',
          productName: 'test product',
          customerEmail: 'test@example.com',
          orderValue: 100
        }
      });
      
      if (error && error.message.includes('OpenAI API key not configured')) {
        systemChecks.push({
          name: 'AI Service (OpenAI)',
          status: 'warning',
          message: 'OpenAI API key not configured - AI features will use fallback responses',
          critical: false
        });
      } else if (error) {
        throw error;
      } else {
        systemChecks.push({
          name: 'AI Service (OpenAI)',
          status: 'success',
          message: 'AI service configured and working',
          critical: false
        });
      }
    } catch (error) {
      systemChecks.push({
        name: 'AI Service (OpenAI)',
        status: 'error',
        message: 'AI service edge function failed',
        critical: false
      });
    }

    // Check Authentication
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        systemChecks.push({
          name: 'Authentication',
          status: 'success',
          message: `Authenticated as ${user.email}`,
          critical: true
        });
      } else {
        systemChecks.push({
          name: 'Authentication',
          status: 'warning',
          message: 'Not authenticated - please login to access features',
          critical: true
        });
      }
    } catch (error) {
      systemChecks.push({
        name: 'Authentication',
        status: 'error',
        message: 'Authentication system error',
        critical: true
      });
    }

    setChecks(systemChecks);
    setLoading(false);
  };

  useEffect(() => {
    runSystemChecks();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success': return <Badge variant="default" className="bg-green-100 text-green-800">Ready</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'error': return <Badge variant="destructive">Error</Badge>;
      default: return null;
    }
  };

  const criticalIssues = checks.filter(check => check.critical && check.status === 'error');
  const hasWarnings = checks.some(check => check.status === 'warning');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6" />
          <CardTitle>System Status</CardTitle>
        </div>
        <CardDescription>
          System health check and configuration status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">Checking system status...</div>
        ) : (
          <>
            {criticalIssues.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Critical issues detected: {criticalIssues.length} component(s) require attention
                </AlertDescription>
              </Alert>
            )}

            {criticalIssues.length === 0 && hasWarnings && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  System is operational with some optional features unavailable
                </AlertDescription>
              </Alert>
            )}

            {criticalIssues.length === 0 && !hasWarnings && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  All systems operational
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {checks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <div className="font-medium">{check.name}</div>
                      <div className="text-sm text-gray-600">{check.message}</div>
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              ))}
            </div>

            <div className="pt-4">
              <Button onClick={runSystemChecks} variant="outline" className="w-full">
                Refresh Status
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemSetup;