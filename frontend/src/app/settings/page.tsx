import { PlantSetupManager } from "@/components/settings/PlantSetupManager";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function SettingsPage() {
  return (
    <RoleGuard allow={["ADMIN"]}>
      <PlantSetupManager />
    </RoleGuard>
  );
}
