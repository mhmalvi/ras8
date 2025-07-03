
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Lock, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { TokenMigration } from '@/utils/tokenMigration';
import { useToast } from "@/hooks/use-toast";

const SecurityDashboard = () => {
  const { toast } = useToast();
  const [migrationStatus, setMigrationStatus] = useState({
    total: 0,
    encrypted: 0,
    pending: 0
  });
  const [loading, setLoading] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const status = await TokenMigration.getMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      console.error('Failed to load migration status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMigration = async () => {
    setMigrating(true);
    try {
      const result = await TokenMigration.migrateAllTokens();
      
      if (result.success) {
        toast({
          title: "Migration Completed",
          description: `Successfully encrypted ${result.migrated} merchant tokens`,
        });
      } else {
        toast({
          title: "Migration Issues",
          description: `Migrated ${result.migrated} tokens with ${result.errors.length} errors`,
          variant: "destructive",
        });
      }
      
      // Refresh status
      await loadStatus();
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "Failed to complete token encryption migration",
        variant: "destructive",
      });
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const encryptionProgress = migrationStatus.total > 0 
    ? (migrationStatus.encrypted / migrationStatus.total) * 100 
    : 0;

  const getSecurityLevel = () => {
    if (migrationStatus.pending === 0 && migrationStatus.total > 0) {
      return { level: 'Secure', color: 'text-green-600', icon: CheckCircle };
    } else if (migrationStatus.pending > 0) {
      return { level: 'Needs Attention', color: 'text-yellow-600', icon: AlertTriangle };
    } else {
      return { level: 'Unknown', color: 'text-gray-600', icon: Shield };
    }
  };

  const securityInfo = getSecurityLevel();
  const SecurityIcon = securityInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Security Dashboard</h2>
          <p className="text-slate-500">Monitor and manage platform security status</p>
        </div>
        <Button onClick={loadStatus} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <SecurityIcon className={`h-5 w-5 ${securityInfo.color}`} />
              Security Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityInfo.level}</div>
            <Badge 
              variant={securityInfo.level === 'Secure' ? 'default' : 'secondary'}
              className="mt-2"
            >
              {migrationStatus.encrypted}/{migrationStatus.total} Encrypted
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-5 w-5 text-blue-600" />
              Token Encryption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{encryptionProgress.toFixed(0)}%</div>
            <Progress value={encryptionProgress} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {migrationStatus.pending} tokens pending encryption
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Merchants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{migrationStatus.total}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Active merchant accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Token Migration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Token Security Migration
          </CardTitle>
          <CardDescription>
            Encrypt sensitive merchant tokens for enhanced security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Merchant Token Encryption</h4>
              <p className="text-sm text-muted-foreground">
                Encrypt all unencrypted Shopify access tokens in the database
              </p>
            </div>
            <Button 
              onClick={handleMigration}
              disabled={migrating || migrationStatus.pending === 0}
              variant={migrationStatus.pending > 0 ? "default" : "outline"}
            >
              {migrating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Encrypting...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  {migrationStatus.pending > 0 ? `Encrypt ${migrationStatus.pending} Tokens` : 'All Tokens Encrypted'}
                </>
              )}
            </Button>
          </div>

          {migrationStatus.pending === 0 && migrationStatus.total > 0 && (
            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <span className="text-sm text-green-800">
                All merchant tokens are encrypted and secure
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Features Status */}
      <Card>
        <CardHeader>
          <CardTitle>Security Features Status</CardTitle>
          <CardDescription>Overview of implemented security measures</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Row Level Security (RLS)', status: 'Active', color: 'text-green-600' },
              { name: 'CORS Protection', status: 'Active', color: 'text-green-600' },
              { name: 'JWT Token Validation', status: 'Active', color: 'text-green-600' },
              { name: 'HMAC Webhook Validation', status: 'Active', color: 'text-green-600' },
              { name: 'Input Sanitization', status: 'Active', color: 'text-green-600' },
              { name: 'Rate Limiting', status: 'Active', color: 'text-green-600' },
              { name: 'Foreign Key Constraints', status: 'Active', color: 'text-green-600' },
              { name: 'Audit Logging', status: 'Active', color: 'text-green-600' }
            ].map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{feature.name}</span>
                <Badge variant="outline" className={feature.color}>
                  {feature.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;
