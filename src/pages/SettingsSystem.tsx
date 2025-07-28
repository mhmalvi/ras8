import SystemPreferences from "@/components/SystemPreferences";
import AppLayout from "@/components/AppLayout";

const SettingsSystem = () => {
  return (
    <AppLayout>
      <div className="animate-fade-in">
        <SystemPreferences />
      </div>
    </AppLayout>
  );
};

export default SettingsSystem;