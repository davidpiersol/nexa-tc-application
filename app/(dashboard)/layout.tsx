import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HelpPanel } from "@/components/help/HelpPanel";
import { createClient } from "@/lib/supabase/server";
import { roleFromUser } from "@/lib/auth/mfa";

/** Dashboard relies on session cookies / RLS — always render on request (no stale empty RSC shell). */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <DashboardShell account={{ email: user?.email, role: user ? roleFromUser(user) : null }}>
        {children}
      </DashboardShell>
      <HelpPanel />
    </>
  );
}
