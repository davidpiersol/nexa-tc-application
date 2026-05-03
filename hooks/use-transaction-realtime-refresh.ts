"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Refreshes the current route when messages, documents, or checklist rows change for a transaction. */
export function useTransactionRealtimeRefresh(transactionId: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (!transactionId) return;
    const supabase = createClient();
    const filter = `transaction_id=eq.${transactionId}`;
    const channel = supabase
      .channel(`realtime-txn-${transactionId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "documents", filter },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "checklist_items", filter },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [transactionId, router]);
}
