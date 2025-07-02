
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Settings, Play, Pause } from "lucide-react";

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  type: string;
  webhookUrl?: string;
  triggers?: number;
  lastRun?: string;
}

interface AutomationRuleCardProps {
  rule: AutomationRule;
  onToggle: (id: string, active: boolean) => void;
  onConfigure: (id: string) => void;
  onTest?: (id: string) => void;
  loading?: boolean;
}

const AutomationRuleCard = ({ 
  rule, 
  onToggle, 
  onConfigure, 
  onTest, 
  loading = false 
}: AutomationRuleCardProps) => {
  const Icon = rule.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`p-2 rounded-lg ${rule.active ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Icon className={`h-5 w-5 ${rule.active ? 'text-blue-600' : 'text-gray-500'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{rule.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {rule.type}
                </Badge>
                {rule.active && (
                  <Badge variant="default" className="text-xs">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-500 mb-2">{rule.description}</p>
              
              {rule.webhookUrl && (
                <div className="text-xs text-muted-foreground mb-2">
                  <span className="font-mono bg-muted px-2 py-1 rounded">
                    {rule.webhookUrl}
                  </span>
                </div>
              )}

              {(rule.triggers || rule.lastRun) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {rule.triggers && (
                    <span>Triggers: {rule.triggers}</span>
                  )}
                  {rule.lastRun && (
                    <span>Last run: {rule.lastRun}</span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Switch 
              checked={rule.active} 
              onCheckedChange={(checked) => onToggle(rule.id, checked)}
              disabled={loading}
            />
            
            {onTest && rule.webhookUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTest(rule.id)}
                disabled={loading}
                className="flex items-center gap-1"
              >
                {rule.active ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                Test
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigure(rule.id)}
              disabled={loading}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutomationRuleCard;
