import { ChangeOwnPasswordForm } from "@/components/dashboard/change-own-password-form";
import { EditOwnProfileForm } from "@/components/dashboard/edit-own-profile-form";

type ProfileBodyProps = {
  email: string | null;
  roleLabel: string;
  userId: string;
  /** Transaction/workspace scope when viewing party dashboards */
  workspaceTransactionId?: string;
};

/** Shared profile shell for every signed-in role. */
export function ProfileBody({
  email,
  roleLabel,
  userId,
  workspaceTransactionId,
}: ProfileBodyProps) {
  return (
    <div className="mx-auto max-w-lg rounded-brand-md border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="font-display text-heading-md text-brand-navy">Account</h2>
      <p className="mt-2 text-sm text-neutral-600">Manage your own profile and password.</p>
      <dl className="mt-6 space-y-4 font-sans text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Email</dt>
          <dd className="mt-1 text-neutral-900">{email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Role</dt>
          <dd className="mt-1 text-neutral-900">{roleLabel}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">User ID</dt>
          <dd className="mt-1 break-all font-mono text-xs text-neutral-700">{userId}</dd>
        </div>
        {workspaceTransactionId ? (
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Workspace transaction
            </dt>
            <dd className="mt-1 break-all font-mono text-xs text-neutral-700">
              {workspaceTransactionId}
            </dd>
          </div>
        ) : null}
      </dl>
      <EditOwnProfileForm />
      <ChangeOwnPasswordForm />
    </div>
  );
}

/** Maps JWT/app role string to short UI label (includes admin/superadmin). */
export function formatRoleLabel(role: string | undefined): string {
  if (!role) return "—";
  const cap: Record<string, string> = {
    tc: "Transaction coordinator",
    broker: "Broker",
    agent: "Broker",
    buyer: "Buyer",
    seller: "Seller",
    mortgage: "Mortgage",
    title: "Title",
    admin: "Administrator",
    tenant_admin: "Tenant administrator",
    global_admin: "Global administrator",
    superadmin: "Super administrator",
  };
  return cap[role] ?? role;
}
