import { redirect } from "next/navigation";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isTenantAdminRole } from "@/lib/auth/roles";
import { TenantUsersConsole } from "@/components/admin/tenant-users-console";

export default async function TenantAdminUsersPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isTenantAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-heading-lg text-brand-navy">Admin Console</h2>
      <TenantUsersConsole />
    </div>
  );
}

