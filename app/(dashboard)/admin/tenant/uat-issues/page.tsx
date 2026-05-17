import { redirect } from "next/navigation";
import { UatIssuesConsole } from "@/components/admin/uat-issues-console";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isTenantAdminRole } from "@/lib/auth/roles";
export default async function TenantUatIssuesPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isTenantAdminRole(actor.role)) redirect("/forbidden");
  return <div className="space-y-4"><h2 className="font-display text-heading-lg text-brand-navy">UAT issues</h2><UatIssuesConsole /></div>;
}
