import IntegrationsManager from "@/components/IntegrationsManager";
import AppLayout from "@/components/AppLayout";

const SettingsIntegrations = () => {
  return (
    <AppLayout>
      <div className="animate-fade-in">
        <IntegrationsManager />
      </div>
    </AppLayout>
  );
};

export default SettingsIntegrations;