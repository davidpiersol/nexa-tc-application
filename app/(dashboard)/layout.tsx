import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { HelpPanel } from "@/components/help/HelpPanel";

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
