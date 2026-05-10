import { redirect } from "next/navigation";
import { loadActorContext } from "@/lib/auth/actor-context";
import { isGlobalAdminRole } from "@/lib/auth/roles";

export default async function GlobalAdminDashboardPage() {
  const actor = await loadActorContext();
  if (!actor) redirect("/login");
  if (!isGlobalAdminRole(actor.role)) redirect("/forbidden");

  return (
    <div className="rounded-brand-md border border-neutral-200 bg-white p-4">
      <h2 className="font-display text-heading-lg text-brand-navy">Global Admin</h2>
      <p className="mt-2 font-sans text-sm text-neutral-600">
        Dashboard is planned for a later sprint.
      </p>
    </div>
  );
}

