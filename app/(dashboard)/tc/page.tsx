import { Suspense } from "react";
import { TcDashboardClient } from "@/components/dashboard/tc-dashboard-client";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { getTcDashboardData } from "@/lib/queries/tc-dashboard";

async function TcDashboardBody() {
  const data = await getTcDashboardData();
  return (
    <TcDashboardClient
      stats={data.stats}
      pipeline={data.pipeline}
      deadlines={data.deadlines}
      tasks={data.tasks}
    />
  );
}

export default function TcDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <TcDashboardBody />
    </Suspense>
  );
}
