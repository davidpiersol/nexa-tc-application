import { redirect } from "next/navigation";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isTenantAdminRole } from "@/lib/auth/roles";
import { TenantAdminConsole } from "@/components/admin/tenant-admin-console";

export default async function TenantAdminPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isTenantAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-heading-lg text-brand-navy">Tenant admin console</h2>
        <p className="mt-2 font-sans text-sm text-neutral-600">
          Manage tenant invite/approval requests within seat limits. Global admin powers remain
          separate.
        </p>
      </div>
      <TenantAdminConsole />
    </div>
  );
}

