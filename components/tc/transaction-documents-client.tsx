"use client";

import * as React from "react";
import { DocumentCard } from "@/components/ui/document-card";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import { documentStatusToBadge } from "@/lib/ui/map-document-status";

export type DocRow = {
  id: string;
  category: string;
  status: string;
  file_name: string | null;
  created_at: string;
};

async function getCsrf(): Promise<string | undefined> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  return json.csrfToken;
}

export function TransactionDocumentsClient({
  transactionId,
  initialDocs,
}: {
  transactionId: string;
  initialDocs: DocRow[];
}) {
  const [docs, setDocs] = React.useState(initialDocs);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDocs(initialDocs);
  }, [initialDocs]);

  async function onUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const token = await getCsrf();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("transaction_id", transactionId);
    setPending(true);
    const res = await fetch("/api/documents", {
      method: "POST",
      credentials: "include",
      headers: { [CSRF_HEADER_NAME]: token },
      body: fd,
    });
    setPending(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Upload failed");
      return;
    }
    const json = (await res.json()) as {
      document?: { id: string; category: string; status: string; file_name: string | null; created_at: string };
    };
    if (json.document) {
      setDocs((prev) => [
        {
          id: json.document!.id,
          category: json.document!.category,
          status: json.document!.status,
          file_name: json.document!.file_name,
          created_at: json.document!.created_at,
        },
        ...prev,
      ]);
    }
    form.reset();
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-sm text-neutral-600">
            Transaction · <span className="text-brand-navy">{transactionId}</span>
          </p>
          <h2 className="font-display text-heading-lg text-brand-navy">Documents</h2>
        </div>
        <form className="flex flex-wrap items-end gap-2" onSubmit={onUpload}>
          <label className="font-sans text-sm text-neutral-600">
            <span className="sr-only">File</span>
            <input
              name="file"
              type="file"
              required
              className="max-w-[220px] font-sans text-sm"
            />
          </label>
          <input type="hidden" name="category" value="contract" />
          <Button type="submit" variant="gold" size="sm" disabled={pending}>
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </header>
      {error ? (
        <p className="font-sans text-sm text-status-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {docs.map((d) => {
          const badge = documentStatusToBadge(d.status);
          return (
            <DocumentCard
              key={d.id}
              category={d.category}
              fileName={d.file_name ?? "Untitled"}
              statusLabel={badge.label}
              statusVariant={badge.variant}
              dateLabel={new Date(d.created_at).toLocaleString()}
            />
          );
        })}
      </div>
    </div>
  );
}
