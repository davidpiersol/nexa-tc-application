import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HelpPanel } from "@/components/help/HelpPanel";
import { createClient } from "@/lib/supabase/server";
import { roleFromUser } from "@/lib/auth/mfa";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/** Dashboard relies on session cookies / RLS — always render on request (no stale empty RSC shell). */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let fullName: string | null = null;
  if (user) {
    const admin = createServiceRoleClient();
    const { data: profile } = await admin.from("users").select("full_name").eq("id", user.id).maybeSingle();
    fullName = profile?.full_name ?? null;
  }

  return (
    <>
      <DashboardShell account={{ email: user?.email, role: user ? roleFromUser(user) : null, fullName }}>
        {children}
      </DashboardShell>
      <HelpPanel />
    </>
  );
}
