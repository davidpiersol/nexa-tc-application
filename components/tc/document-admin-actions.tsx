"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type Props = {
  documentId: string;
  backTo: string;
};

async function getCsrf(): Promise<string | undefined> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  return json.csrfToken;
}

export function DocumentAdminActions({ documentId, backTo }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<null | "revise" | "delete">(null);
  const [error, setError] = useState<string | null>(null);

  async function revise(file: File) {
    const token = await getCsrf();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }

    const fd = new FormData();
    fd.set("file", file);

    const res = await fetch(`/api/documents/${documentId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { [CSRF_HEADER_NAME]: token },
      body: fd,
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not upload revised document.");
      return;
    }

    router.refresh();
  }

  async function remove() {
    const confirmed = window.confirm("Delete this document? This cannot be undone.");
    if (!confirmed) return;

    const token = await getCsrf();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }

    const res = await fetch(`/api/documents/${documentId}`, {
      method: "DELETE",
      credentials: "include",
      headers: { [CSRF_HEADER_NAME]: token },
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not delete document.");
      return;
    }

    router.push(backTo);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={async (e) => {
            const file = e.currentTarget.files?.[0];
            if (!file) return;
            setError(null);
            setPending("revise");
            try {
              await revise(file);
            } finally {
              setPending(null);
              e.currentTarget.value = "";
            }
          }}
        />

        <Button
          variant="gold"
          size="sm"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={pending !== null}
        >
          {pending === "revise" ? "Uploading revision…" : "Upload revised document"}
        </Button>

        <Button
          variant="danger"
          size="sm"
          type="button"
          onClick={async () => {
            setError(null);
            setPending("delete");
            try {
              await remove();
            } finally {
              setPending(null);
            }
          }}
          disabled={pending !== null}
        >
          {pending === "delete" ? "Deleting…" : "Delete document"}
        </Button>
      </div>

      {error ? (
        <p className="font-sans text-xs text-status-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
