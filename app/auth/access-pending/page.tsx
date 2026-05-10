import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { loadPublicUserProfile } from "@/lib/auth/profile-check";
import { createClient } from "@/lib/supabase/server";

/**
 * Shown when an OAuth user has no `public.users` row yet (no invite / no admin provisioning).
 */
export default async function AccessPendingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (await loadPublicUserProfile(user.id)) {
    redirect("/api/auth/role-redirect");
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-heading-lg text-brand-navy">Access pending</h1>
      <p className="font-sans text-ui-body text-neutral-700">
        You signed in with a social account, but your workspace profile is not provisioned yet.
        Transaction coordinator, broker, and administrator access requires an invitation from your
        organization or approval from an administrator.
      </p>
      <p className="font-sans text-sm text-neutral-600">
        If you expected instant access, confirm you used the same email as your invitation, or ask
        your coordinator to send a new invite.
      </p>
      <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4">
        <Link
          href="/login"
          className="font-sans text-sm font-semibold text-brand-steel underline underline-offset-4"
        >
          Back to sign in
        </Link>
        <SignOutButton variant="secondary" />
      </div>
    </div>
  );
}
