import AutomationSettings from "@/components/AutomationSettings";
import AppLayout from "@/components/AppLayout";
import { Activity } from "lucide-react";

const SettingsAutomation = () => {
  return (
    <AppLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Automation System
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Configure automated workflows, rules, labels, and n8n integrations
          </p>
        </div>

        {/* Automation Configuration */}
        <div>
          <AutomationSettings />
        </div>
      </div>
    </AppLayout>
  );
};

export default SettingsAutomation;