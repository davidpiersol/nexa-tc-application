import { redirect } from "next/navigation";
import { UatIssuesConsole } from "@/components/admin/uat-issues-console";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isGlobalAdminRole } from "@/lib/auth/roles";
export default async function GlobalUatIssuesPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isGlobalAdminRole(actor.role)) redirect("/forbidden");
  return <div className="space-y-4"><h2 className="font-display text-heading-lg text-brand-navy">UAT issues</h2><UatIssuesConsole /></div>;
}
