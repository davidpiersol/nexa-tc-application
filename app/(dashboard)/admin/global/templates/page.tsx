import { redirect } from "next/navigation";
import { GlobalTemplateConsole } from "@/components/admin/global-template-console";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isGlobalAdminRole } from "@/lib/auth/roles";

export default async function GlobalAdminTemplatesPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isGlobalAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-heading-lg text-brand-navy">Templates</h2>
      <GlobalTemplateConsole />
    </div>
  );
}
