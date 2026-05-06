"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Refreshes the current route when messages, documents, or checklist rows change for a transaction. */
export function useTransactionRealtimeRefresh(transactionId: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (!transactionId) return;
    let supabase: ReturnType<typeof createClient> | null = null;
    let channel:
      | ReturnType<ReturnType<typeof createClient>["channel"]>
      | null = null;

    try {
      supabase = createClient();
      const filter = `transaction_id=eq.${transactionId}`;
      channel = supabase
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
    } catch (error) {
      // Some browsers / environments can block websocket setup (e.g. insecure operation).
      // Keep the transaction workspace usable without realtime auto-refresh.
      console.warn("Realtime refresh disabled for this session.", error);
      return;
    }

    return () => {
      if (supabase && channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [transactionId, router]);
}
