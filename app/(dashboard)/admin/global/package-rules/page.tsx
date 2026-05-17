import { redirect } from "next/navigation";
import { GlobalPackageRulesConsole } from "@/components/admin/global-package-rules-console";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isGlobalAdminRole } from "@/lib/auth/roles";

export default async function GlobalPackageRulesPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isGlobalAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-heading-lg text-brand-navy">Package rules</h2>
      <GlobalPackageRulesConsole />
    </div>
  );
}
