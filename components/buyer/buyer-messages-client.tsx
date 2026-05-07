"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageThread, type ThreadMessage } from "@/components/ui/message-thread";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type ApiMessage = {
  id: string;
  body: string;
  sender_user_id: string | null;
};

async function getCsrfToken(): Promise<string | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  return json.csrfToken ?? null;
}

export function BuyerMessagesClient({ transactionId }: { transactionId: string }) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/messages?transaction_id=${encodeURIComponent(transactionId)}`, {
      credentials: "include",
    });
    if (!res.ok) return;
    const body = (await res.json()) as { messages?: ApiMessage[] };
    setMessages(
      (body.messages ?? []).map((m) => ({
        id: m.id,
        author: m.sender_user_id ? "Participant" : "System",
        body: m.body,
        variant: "party",
      })),
    );
  }, [transactionId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function send() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setError(null);
    setSending(true);

    const token = await getCsrfToken();
    if (!token) {
      setError("Security token missing. Refresh and retry.");
      setSending(false);
      return;
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({ transaction_id: transactionId, body: trimmed }),
    });

    setSending(false);
    if (!res.ok) {
      setError("Could not send message.");
      return;
    }
    setDraft("");
    await load();
  }

  return (
    <div className="flex flex-col gap-4">
      <MessageThread messages={messages} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
        <Input
          label="Message"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message to your TC…"
        />
        <div className="sm:pt-7">
          <Button variant="gold" type="button" loading={sending} onClick={() => void send()}>
            Send
          </Button>
        </div>
      </div>
      {error ? <p className="font-sans text-sm text-status-danger">{error}</p> : null}
    </div>
  );
}
