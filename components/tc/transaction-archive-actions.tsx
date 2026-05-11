"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

async function getCsrfToken(): Promise<string | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  return json.csrfToken ?? null;
}

export function TransactionArchiveActions({
  transactionId,
  canArchive,
  isArchived,
}: {
  transactionId: string;
  canArchive: boolean;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<"archive" | "restore" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function archive() {
    const token = await getCsrfToken();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }
    const res = await fetch(`/api/transactions/${transactionId}/archive`, {
      method: "POST",
      credentials: "include",
      headers: { [CSRF_HEADER_NAME]: token },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not archive transaction.");
      return;
    }
    router.push("/tc/archive");
    router.refresh();
  }

  async function restore() {
    const token = await getCsrfToken();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }
    const res = await fetch(`/api/transactions/${transactionId}/archive`, {
      method: "DELETE",
      credentials: "include",
      headers: { [CSRF_HEADER_NAME]: token },
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not restore transaction.");
      return;
    }
    router.push(`/tc/transactions/${transactionId}`);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {canArchive && !isArchived ? (
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={pending !== null}
          onClick={async () => {
            setError(null);
            setPending("archive");
            try {
              await archive();
            } finally {
              setPending(null);
            }
          }}
        >
          {pending === "archive" ? "Archiving…" : "Archive transaction"}
        </Button>
      ) : null}

      {isArchived ? (
        <Button
          variant="ghost"
          size="sm"
          type="button"
          disabled={pending !== null}
          onClick={async () => {
            setError(null);
            setPending("restore");
            try {
              await restore();
            } finally {
              setPending(null);
            }
          }}
        >
          {pending === "restore" ? "Restoring…" : "Restore to active views"}
        </Button>
      ) : null}

      {error ? <p className="font-sans text-xs text-status-danger">{error}</p> : null}
    </div>
  );
}
