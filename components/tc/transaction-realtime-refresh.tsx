"use client";

import type { ReactNode } from "react";
import { useTransactionRealtimeRefresh } from "@/hooks/use-transaction-realtime-refresh";

export function TransactionRealtimeRefresh({
  transactionId,
  children,
}: {
  transactionId: string;
  children: ReactNode;
}) {
  useTransactionRealtimeRefresh(transactionId);
  return <>{children}</>;
}
