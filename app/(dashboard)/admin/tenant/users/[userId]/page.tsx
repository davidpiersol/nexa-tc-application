import { redirect } from "next/navigation";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isTenantAdminRole } from "@/lib/auth/roles";
import { TenantUserDetailConsole } from "@/components/admin/tenant-user-detail-console";

type Props = { params: { userId: string } };

export default async function TenantUserDetailsPage({ params }: Props) {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isTenantAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-heading-lg text-brand-navy">Admin Console</h2>
      <TenantUserDetailConsole userId={params.userId} />
    </div>
  );
}

