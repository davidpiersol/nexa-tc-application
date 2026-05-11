"use client";

import * as React from "react";
import Link from "next/link";
import { DocumentCard } from "@/components/ui/document-card";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import { documentStatusToBadge } from "@/lib/ui/map-document-status";
import { DocumentDownloadButton } from "@/components/tc/document-download-button";
import {
  templateAvailabilityLabel,
  templateSelectionStateLabel,
} from "@/lib/documents/template-selection";

export type DocRow = {
  id: string;
  category: string;
  status: string;
  file_name: string | null;
  created_at: string;
};

export type TemplateSelectionRow = {
  id: string;
  template_id: string;
  template_version_id: string | null;
  selection_state: string;
  document_status: string;
  notes: string | null;
  created_at: string;
  template: {
    id: string;
    form_number: string;
    title: string;
    category: string;
    jurisdiction_state: string;
    availability_status: string;
  } | null;
  version: {
    id: string;
    version_label: string;
    storage_path: string;
  } | null;
};

type ViewMode = "card" | "list";
type SortMode = "newest" | "oldest" | "name_asc" | "name_desc" | "status";

async function getCsrf(): Promise<string | undefined> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  return json.csrfToken;
}

function sortDocuments(rows: DocRow[], sort: SortMode): DocRow[] {
  const out = [...rows];
  if (sort === "newest") {
    out.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return out;
  }
  if (sort === "oldest") {
    out.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    return out;
  }
  if (sort === "name_asc") {
    out.sort((a, b) =>
      (a.file_name ?? "Untitled").localeCompare(b.file_name ?? "Untitled", undefined, {
        sensitivity: "base",
      }),
    );
    return out;
  }
  if (sort === "name_desc") {
    out.sort((a, b) =>
      (b.file_name ?? "Untitled").localeCompare(a.file_name ?? "Untitled", undefined, {
        sensitivity: "base",
      }),
    );
    return out;
  }
  out.sort((a, b) => {
    const byStatus = a.status.localeCompare(b.status, undefined, { sensitivity: "base" });
    if (byStatus !== 0) return byStatus;
    return +new Date(b.created_at) - +new Date(a.created_at);
  });
  return out;
}

export function TransactionDocumentsClient({
  transactionId,
  initialDocs,
  initialSelections,
}: {
  transactionId: string;
  initialDocs: DocRow[];
  initialSelections: TemplateSelectionRow[];
}) {
  const [docs, setDocs] = React.useState(initialDocs);
  const [selections, setSelections] = React.useState(initialSelections);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("card");
  const [sortMode, setSortMode] = React.useState<SortMode>("newest");
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    setDocs(initialDocs);
  }, [initialDocs]);

  React.useEffect(() => {
    setSelections(initialSelections);
  }, [initialSelections]);

  const visibleDocs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q.length
      ? docs.filter((d) => {
          const fileName = (d.file_name ?? "").toLowerCase();
          const category = String(d.category).toLowerCase();
          const status = String(d.status).toLowerCase();
          return fileName.includes(q) || category.includes(q) || status.includes(q);
        })
      : docs;
    return sortDocuments(filtered, sortMode);
  }, [docs, query, sortMode]);

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
    const created = json.document;
    if (created) {
      setDocs((prev) => [
        {
          id: created.id,
          category: created.category,
          status: created.status,
          file_name: created.file_name,
          created_at: created.created_at,
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

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
        <div className="flex flex-col gap-2 border-b border-neutral-200 pb-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-display text-heading-md text-brand-navy">
              Document checklist foundation
            </h3>
            <p className="mt-1 font-sans text-sm text-neutral-600">
              Selected templates with required/optional/default and availability states.
            </p>
          </div>
          <Button variant="secondary" type="button" size="sm" disabled>
            Export packet (manual placeholder)
          </Button>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {selections.map((selection) => {
            const statusBadge = documentStatusToBadge(selection.document_status);
            return (
              <li
                key={selection.id}
                className="rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-sans text-sm text-neutral-900"
              >
                <p className="font-medium text-brand-navy">
                  {selection.template?.title ?? "Template"}{" "}
                  {selection.template?.form_number ? `(${selection.template.form_number})` : ""}
                </p>
                <p className="mt-1 text-neutral-700">
                  State · {templateSelectionStateLabel(selection.selection_state)} · Status ·{" "}
                  {statusBadge.label}
                  {selection.template?.availability_status ? (
                    <>
                      {" "}
                      · Availability ·{" "}
                      {templateAvailabilityLabel(selection.template.availability_status)}
                    </>
                  ) : null}
                </p>
              </li>
            );
          })}
          {selections.length === 0 ? (
            <li className="rounded-brand-md border border-neutral-200 bg-neutral-50 px-3 py-2 font-sans text-sm text-neutral-600">
              No template selections yet for this transaction.
            </li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant={viewMode === "card" ? "gold" : "secondary"}
              onClick={() => setViewMode("card")}
            >
              Card view
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === "list" ? "gold" : "secondary"}
              onClick={() => setViewMode("list")}
            >
              List view
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="tc-doc-search">
              Search documents
            </label>
            <input
              id="tc-doc-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search file, category, status"
              className="h-9 w-[240px] rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-sm text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            />

            <label className="sr-only" htmlFor="tc-doc-sort">
              Sort documents
            </label>
            <select
              id="tc-doc-sort"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="h-9 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-sm text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="name_asc">File name A-Z</option>
              <option value="name_desc">File name Z-A</option>
              <option value="status">Status</option>
            </select>
          </div>
        </div>

        <p className="mt-3 font-sans text-xs text-neutral-600">
          Showing {visibleDocs.length} of {docs.length} document{docs.length === 1 ? "" : "s"}
        </p>
      </section>

      {error ? (
        <p className="font-sans text-sm text-status-danger" role="alert">
          {error}
        </p>
      ) : null}

      {viewMode === "card" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleDocs.map((d) => {
            const badge = documentStatusToBadge(d.status);
            return (
              <div key={d.id} className="flex flex-col gap-2">
                <Link href={`/tc/transactions/${transactionId}/documents/${d.id}`} className="inline-block">
                  <DocumentCard
                    category={d.category}
                    fileName={d.file_name ?? "Untitled"}
                    statusLabel={badge.label}
                    statusVariant={badge.variant}
                    dateLabel={new Date(d.created_at).toLocaleString()}
                  />
                </Link>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" type="button" asChild>
                    <Link href={`/tc/transactions/${transactionId}/documents/${d.id}`}>Open</Link>
                  </Button>
                  <DocumentDownloadButton documentId={d.id} size="sm" label="Download" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-brand-lg border border-neutral-300 bg-white shadow-brand-sm">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                <th className="px-3 py-2 font-sans text-xs uppercase tracking-wide text-neutral-600">File</th>
                <th className="px-3 py-2 font-sans text-xs uppercase tracking-wide text-neutral-600">Category</th>
                <th className="px-3 py-2 font-sans text-xs uppercase tracking-wide text-neutral-600">Status</th>
                <th className="px-3 py-2 font-sans text-xs uppercase tracking-wide text-neutral-600">Uploaded</th>
                <th className="px-3 py-2 font-sans text-xs uppercase tracking-wide text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleDocs.map((d) => {
                const badge = documentStatusToBadge(d.status);
                return (
                  <tr key={d.id} className="border-b border-neutral-200 last:border-b-0">
                    <td className="px-3 py-2 font-sans text-sm text-brand-navy">
                      <Link
                        href={`/tc/transactions/${transactionId}/documents/${d.id}`}
                        className="underline underline-offset-2"
                      >
                        {d.file_name ?? "Untitled"}
                      </Link>
                    </td>
                    <td className="px-3 py-2 font-sans text-sm text-neutral-900">{d.category}</td>
                    <td className="px-3 py-2 font-sans text-sm text-neutral-900">{badge.label}</td>
                    <td className="px-3 py-2 font-sans text-sm text-neutral-600">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="secondary" size="sm" type="button" asChild>
                          <Link href={`/tc/transactions/${transactionId}/documents/${d.id}`}>Open</Link>
                        </Button>
                        <DocumentDownloadButton documentId={d.id} size="sm" label="Download" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {visibleDocs.length === 0 ? (
        <p className="rounded-brand-md border border-neutral-300 bg-white px-4 py-3 font-sans text-sm text-neutral-600">
          No documents match your current filters.
        </p>
      ) : null}
    </div>
  );
}
