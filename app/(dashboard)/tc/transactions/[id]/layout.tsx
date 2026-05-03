import type { ReactNode } from "react";
import { TransactionRealtimeRefresh } from "@/components/tc/transaction-realtime-refresh";

export default function TransactionWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { id: string };
}) {
  return (
    <TransactionRealtimeRefresh transactionId={params.id}>
      {children}
    </TransactionRealtimeRefresh>
  );
}
