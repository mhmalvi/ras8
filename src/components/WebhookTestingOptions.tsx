
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Settings, Server, Globe, Shield } from "lucide-react";

interface WebhookTestOptions {
  preferServerSide?: boolean;
  fallbackToBrowser?: boolean;
  testType?: 'server_side' | 'browser_based' | 'both';
}

interface WebhookTestingOptionsProps {
  options: WebhookTestOptions;
  onChange: (options: WebhookTestOptions) => void;
}

const WebhookTestingOptions = ({ options, onChange }: WebhookTestingOptionsProps) => {
  const handleTestTypeChange = (testType: string) => {
    const newOptions = { ...options, testType: testType as any };
    
    if (testType === 'server_side') {
      newOptions.preferServerSide = true;
      newOptions.fallbackToBrowser = false;
    } else if (testType === 'browser_based') {
      newOptions.preferServerSide = false;
      newOptions.fallbackToBrowser = false;
    } else if (testType === 'both') {
      newOptions.preferServerSide = true;
      newOptions.fallbackToBrowser = true;
    }
    
    onChange(newOptions);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Webhook Testing Options
        </CardTitle>
        <CardDescription>
          Configure how webhook tests are performed - server-side or browser-based
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Type Selector */}
        <div className="space-y-2">
          <Label htmlFor="test-type">Testing Method</Label>
          <Select
            value={options.testType || 'both'}
            onValueChange={handleTestTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select testing method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="server_side">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Server-side Only
                </div>
              </SelectItem>
              <SelectItem value="browser_based">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Browser-based Only
                </div>
              </SelectItem>
              <SelectItem value="both">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Both (Server-side with Browser fallback)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Options for 'both' mode */}
        {options.testType === 'both' && (
          <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium text-sm">Advanced Options</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="prefer-server">Prefer Server-side Testing</Label>
                <p className="text-xs text-muted-foreground">
                  Try server-side testing first
                </p>
              </div>
              <Switch
                id="prefer-server"
                checked={options.preferServerSide ?? true}
                onCheckedChange={(checked) =>
                  onChange({ ...options, preferServerSide: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="fallback-browser">Fallback to Browser</Label>
                <p className="text-xs text-muted-foreground">
                  Use browser testing if server-side fails
                </p>
              </div>
              <Switch
                id="fallback-browser"
                checked={options.fallbackToBrowser ?? true}
                onCheckedChange={(checked) =>
                  onChange({ ...options, fallbackToBrowser: checked })
                }
              />
            </div>
          </div>
        )}

        {/* Testing Method Explanations */}
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Server className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-800">Server-side Testing</p>
                <p className="text-blue-700">
                  Bypasses CORS restrictions, more reliable, supports all webhook configurations
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Browser-based Testing</p>
                <p className="text-orange-700">
                  Direct from browser, may be blocked by CORS policies, faster response
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">Both Methods (Recommended)</p>
                <p className="text-green-700">
                  Try server-side first, fallback to browser if needed - best of both worlds
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Configuration Display */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium">Current Configuration:</span>
            <Badge variant="outline">
              {options.testType === 'server_side' && 'Server-side Only'}
              {options.testType === 'browser_based' && 'Browser-based Only'}
              {options.testType === 'both' && 'Unified Testing'}
            </Badge>
          </div>
          
          {options.testType === 'both' && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Server-side preferred: {options.preferServerSide ? 'Yes' : 'No'}</p>
              <p>• Browser fallback: {options.fallbackToBrowser ? 'Enabled' : 'Disabled'}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WebhookTestingOptions;
