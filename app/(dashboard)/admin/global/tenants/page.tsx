import { redirect } from "next/navigation";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isGlobalAdminRole } from "@/lib/auth/roles";
import { GlobalAdminConsole } from "@/components/admin/global-admin-console";

export default async function GlobalAdminTenantsPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isGlobalAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-heading-lg text-brand-navy">Global Admin</h2>
      <GlobalAdminConsole />
    </div>
  );
}

