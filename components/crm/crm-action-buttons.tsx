"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

async function csrfToken(): Promise<string | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  return json.csrfToken ?? null;
}

export function CrmDeleteButton({
  endpoint,
  returnHref,
}: {
  endpoint: string;
  returnHref: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    if (!window.confirm("Delete this CRM record?")) return;
    setLoading(true);
    setError(null);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("Security token unavailable.");
      const res = await fetch(endpoint, {
        method: "DELETE",
        credentials: "include",
        headers: { [CSRF_HEADER_NAME]: token },
      });
      if (!res.ok) throw new Error("Delete failed.");
      router.push(returnHref);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant="danger" size="sm" loading={loading} onClick={onDelete}>
        <Trash2 className="size-4" aria-hidden />
        Delete
      </Button>
      {error ? <p className="font-sans text-sm text-status-danger">{error}</p> : null}
    </div>
  );
}
