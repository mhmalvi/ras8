
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Settings, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NotificationService } from "@/services/notificationService";

interface EmailSettings {
  returnStatusUpdates: boolean;
  aiSuggestions: boolean;
  returnApprovals: boolean;
  exchangeOffers: boolean;
  merchantName: string;
  fromEmail: string;
}

const EmailNotificationSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<EmailSettings>({
    returnStatusUpdates: true,
    aiSuggestions: true,
    returnApprovals: true,
    exchangeOffers: true,
    merchantName: 'Your Store',
    fromEmail: 'noreply@yourstore.com'
  });
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  const handleSettingChange = (key: keyof EmailSettings, value: boolean | string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const sendTestEmail = async () => {
    if (!testEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter an email address to send test notification.",
        variant: "destructive"
      });
      return;
    }

    setSending(true);
    try {
      const result = await NotificationService.sendEmailNotification({
        type: 'return_status',
        recipientEmail: testEmail,
        customerName: 'Test Customer',
        returnId: 'TEST-001',
        orderNumber: '#12345',
        status: 'Processing',
        reason: 'Test notification',
        merchantName: settings.merchantName
      });

      if (result.success) {
        toast({
          title: "Test Email Sent",
          description: `Test notification sent to ${testEmail}`,
        });
        setTestEmail('');
      } else {
        throw new Error(result.message || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Test email failed:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send test email. Please check your configuration.",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Notification Settings
          </CardTitle>
          <CardDescription>
            Configure automated email notifications for your customers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="merchantName">Store Name</Label>
                <Input
                  id="merchantName"
                  value={settings.merchantName}
                  onChange={(e) => handleSettingChange('merchantName', e.target.value)}
                  placeholder="Your Store Name"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This name will appear in email signatures
                </p>
              </div>
              <div>
                <Label htmlFor="fromEmail">From Email (Display Only)</Label>
                <Input
                  id="fromEmail"
                  value={settings.fromEmail}
                  onChange={(e) => handleSettingChange('fromEmail', e.target.value)}
                  placeholder="noreply@yourstore.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Actual sending handled by Resend service
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notification Types</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="returnStatus">Return Status Updates</Label>
                    <Badge variant="outline" className="text-xs">Essential</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Notify customers when return status changes
                  </p>
                </div>
                <Switch
                  id="returnStatus"
                  checked={settings.returnStatusUpdates}
                  onCheckedChange={(checked) => handleSettingChange('returnStatusUpdates', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="aiSuggestions">AI Suggestions</Label>
                    <Badge variant="secondary" className="text-xs">Smart</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Send AI-powered exchange recommendations
                  </p>
                </div>
                <Switch
                  id="aiSuggestions"
                  checked={settings.aiSuggestions}
                  onCheckedChange={(checked) => handleSettingChange('aiSuggestions', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="returnApprovals">Return Approvals</Label>
                    <Badge variant="outline" className="text-xs">Important</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Confirm when returns are approved or rejected
                  </p>
                </div>
                <Switch
                  id="returnApprovals"
                  checked={settings.returnApprovals}
                  onCheckedChange={(checked) => handleSettingChange('returnApprovals', checked)}
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="exchangeOffers">Exchange Offers</Label>
                    <Badge variant="secondary" className="text-xs">Revenue+</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Promote exchanges over refunds
                  </p>
                </div>
                <Switch
                  id="exchangeOffers"
                  checked={settings.exchangeOffers}
                  onCheckedChange={(checked) => handleSettingChange('exchangeOffers', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Test Email */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Test Notifications</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Enter email to test notifications"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                type="email"
                className="flex-1"
              />
              <Button 
                onClick={sendTestEmail} 
                disabled={sending || !testEmail.trim()}
                className="min-w-32"
              >
                {sending ? (
                  <>
                    <Settings className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Test
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              This will send a sample return status notification to test your email setup.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Email Templates Preview
          </CardTitle>
          <CardDescription>
            Professional email templates are automatically generated for each notification type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium">Available Templates:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Return Status Updates</li>
                <li>• AI Exchange Suggestions</li>
                <li>• Return Approvals</li>
                <li>• Return Rejections</li>
                <li>• Exchange Offers</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Features:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Responsive HTML design</li>
                <li>• Brand-aligned styling</li>
                <li>• Clear call-to-actions</li>
                <li>• Mobile-optimized</li>
                <li>• Professional appearance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailNotificationSettings;
