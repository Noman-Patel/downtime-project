import { RoleGuard } from "@/components/auth/RoleGuard";
import { UserManager } from "@/components/users/UserManager";

export default function UsersPage() {
  return (
    <RoleGuard allow={["ADMIN"]}>
      <UserManager />
    </RoleGuard>
  );
}
