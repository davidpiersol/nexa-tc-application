import { redirect } from "next/navigation";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isGlobalAdminRole } from "@/lib/auth/roles";
import { GlobalAdminConsole } from "@/components/admin/global-admin-console";

export default async function GlobalAdminPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isGlobalAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-heading-lg text-brand-navy">Global admin console</h2>
        <p className="mt-2 font-sans text-sm text-neutral-600">
          Manage tenants, tenant-admin assignments, seat limits, and platform-level governance
          scaffolding.
        </p>
      </div>
      <GlobalAdminConsole />
    </div>
  );
}

