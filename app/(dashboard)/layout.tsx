import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HelpPanel } from "@/components/help/HelpPanel";

/** Dashboard relies on session cookies / RLS — always render on request (no stale empty RSC shell). */
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <HelpPanel />
    </>
  );
}
