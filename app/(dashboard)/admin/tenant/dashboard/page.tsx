import { redirect } from "next/navigation";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isTenantAdminRole } from "@/lib/auth/roles";
import { TenantAdminConsole } from "@/components/admin/tenant-admin-console";

export default async function TenantAdminDashboardPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isTenantAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-heading-lg text-brand-navy">Admin Console</h2>
      <p className="font-sans text-sm text-neutral-600">
        Dashboard placeholder. Invite and approval workflow remains active here.
      </p>
      <TenantAdminConsole />
    </div>
  );
}

