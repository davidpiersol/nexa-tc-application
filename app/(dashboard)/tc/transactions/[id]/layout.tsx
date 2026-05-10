import type { ReactNode } from "react";
import { TransactionRealtimeRefresh } from "@/components/tc/transaction-realtime-refresh";
import { TransactionWorkspaceNav } from "@/components/tc/transaction-workspace-nav";

export default function TransactionWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { id: string };
}) {
  return (
    <TransactionRealtimeRefresh transactionId={params.id}>
      <div className="flex flex-col gap-6">
        <TransactionWorkspaceNav transactionId={params.id} />
        {children}
      </div>
    </TransactionRealtimeRefresh>
  );
}
