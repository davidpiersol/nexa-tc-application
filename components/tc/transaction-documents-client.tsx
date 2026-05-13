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
  /** Row has attachment storage — included in ZIP / signing bundle. */
  can_export: boolean;
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
  signingPreference = null,
}: {
  transactionId: string;
  initialDocs: DocRow[];
  initialSelections: TemplateSelectionRow[];
  signingPreference?: { slug: string; label: string } | null;
}) {
  const [docs, setDocs] = React.useState(initialDocs);
  const [selections, setSelections] = React.useState(initialSelections);
  const [pending, setPending] = React.useState(false);
  const [generatingSelectionId, setGeneratingSelectionId] = React.useState<string | null>(
    null,
  );
  const [error, setError] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<ViewMode>("card");
  const [sortMode, setSortMode] = React.useState<SortMode>("newest");
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [packetPending, setPacketPending] = React.useState(false);
  const [signingPending, setSigningPending] = React.useState(false);
  const [signerEmail, setSignerEmail] = React.useState("");
  const [signerName, setSignerName] = React.useState("");
  const [workflowMessage, setWorkflowMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDocs(initialDocs);
  }, [initialDocs]);

  React.useEffect(() => {
    setSelections(initialSelections);
  }, [initialSelections]);

  React.useEffect(() => {
    setSelected((prev) => {
      const next = new Set<string>();
      for (const id of prev) {
        const row = docs.find((d) => d.id === id);
        if (row?.can_export) next.add(id);
      }
      return next;
    });
  }, [docs]);

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

  const exportableVisible = React.useMemo(
    () => visibleDocs.filter((d) => d.can_export),
    [visibleDocs],
  );

  function toggleDocSelect(id: string) {
    const row = docs.find((d) => d.id === id);
    if (!row?.can_export) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllExportableVisible() {
    setSelected(new Set(exportableVisible.map((d) => d.id)));
  }

  async function exportPacketZip() {
    setError(null);
    setWorkflowMessage(null);
    const ids = [...selected];
    if (ids.length === 0) {
      setError("Select at least one document with an uploaded file to export.");
      return;
    }
    const token = await getCsrf();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }
    setPacketPending(true);
    const res = await fetch(`/api/transactions/${transactionId}/documents/packet-export`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({ document_ids: ids }),
    });
    setPacketPending(false);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "ZIP export failed");
      return;
    }
    const blob = await res.blob();
    const dispo = res.headers.get("Content-Disposition");
    const fname =
      dispo?.match(/filename="([^"]+)"/)?.[1]?.trim() ??
      `nexa-packet-${transactionId}-${Date.now()}.zip`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setWorkflowMessage("Packet ZIP downloaded. Use Choral Point or your signing workspace as needed.");
  }

  async function sendForSigning() {
    setError(null);
    setWorkflowMessage(null);
    const idsSnapshot = [...selected];
    if (idsSnapshot.length === 0) {
      setError("Select at least one document with an uploaded file.");
      return;
    }
    const token = await getCsrf();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }
    setSigningPending(true);
    const res = await fetch(`/api/transactions/${transactionId}/documents/send-for-signing`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({
        document_ids: idsSnapshot,
        ...(signerEmail.trim() ? { signer_email: signerEmail.trim() } : {}),
        ...(signerName.trim() ? { signer_name: signerName.trim() } : {}),
      }),
    });
    setSigningPending(false);

    type SendJson = {
      ok?: boolean;
      executed_provider?: string;
      envelope_id?: string | null;
      manual_hint?: string;
      error?: string;
    };

    let body: SendJson;
    try {
      body = (await res.json()) as SendJson;
    } catch {
      setError("Signing request failed.");
      return;
    }

    if (!res.ok) {
      setError(body.error ?? "Send for signing failed");
      return;
    }

    let msg =
      body.executed_provider === "docusign_api" && body.envelope_id
        ? "Envelope sent via DocuSign."
        : "Marked sent for signature. Use Export ZIP Choral Point or your external signing workflow when DocuSign is not used.";
    if (body.manual_hint) {
      msg = `${msg} (${body.manual_hint})`;
    }
    setWorkflowMessage(msg);

    setDocs((prev) =>
      prev.map((d) =>
        idsSnapshot.includes(d.id) ? { ...d, status: "sent_for_signature" } : d,
      ),
    );
  }

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
          can_export: true,
        },
        ...prev,
      ]);
    }
    form.reset();
  }

  async function onGenerateFilledPdf(selectionId: string) {
    setError(null);
    const token = await getCsrf();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }
    setGeneratingSelectionId(selectionId);
    const res = await fetch(`/api/transactions/${transactionId}/documents/generate`, {
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({ selection_id: selectionId }),
    });
    setGeneratingSelectionId(null);
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as {
        error?: string;
        missing_fields?: string[];
      };
      if (j.error === "missing_mapped_data" && Array.isArray(j.missing_fields)) {
        setError(
          `Fill in these fields on the transaction before generating: ${j.missing_fields.join(", ")}`,
        );
      } else {
        setError(j.error ?? "PDF generation failed");
      }
      return;
    }
    const listRes = await fetch(
      `/api/documents?transaction_id=${encodeURIComponent(transactionId)}`,
      { credentials: "include" },
    );
    if (!listRes.ok) {
      setError("Generated PDF saved; refresh the page to see the document list.");
      return;
    }
    const listJson = (await listRes.json()) as {
      documents?: Array<{
        id: string;
        category: string;
        status: string;
        file_name: string | null;
        created_at: string;
        can_export?: boolean;
      }>;
    };
    const next = listJson.documents ?? [];
    setDocs(
      next.map((d) => ({
        id: d.id,
        category: d.category,
        status: d.status,
        file_name: d.file_name,
        created_at: d.created_at,
        can_export: Boolean(d.can_export),
      })),
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-sm text-neutral-600">
            Transaction · <span className="text-brand-navy">{transactionId}</span>
          </p>
          <h2 className="font-display text-heading-lg text-brand-navy">Documents</h2>
          {signingPreference ? (
            <p className="mt-2 max-w-3xl font-sans text-sm text-neutral-700">
              Broker default signing: <strong>{signingPreference.label}</strong>
              {signingPreference.slug === "docusign_api"
                ? ". DocuSign runs when tenant credentials are configured; otherwise Nexa falls back to a neutral / manual workflow."
                : ". Use Export ZIP for Choral Point or carry files into your external signing workspace."}
            </p>
          ) : null}
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
              Selected templates with required/optional/default and availability states. Generated PDFs appear
              in the uploads list below — build a Choral Point packet or start signing from there.
            </p>
          </div>
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
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={
                      !selection.template_version_id ||
                      generatingSelectionId !== null
                    }
                    onClick={() => onGenerateFilledPdf(selection.id)}
                  >
                    {generatingSelectionId === selection.id
                      ? "Generating…"
                      : "Generate filled PDF"}
                  </Button>
                  {!selection.template_version_id ? (
                    <span className="font-sans text-xs text-neutral-600">
                      Pick an approved template version on this checklist row before generating.
                    </span>
                  ) : null}
                </div>
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

        <div className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-4 xl:flex-row xl:flex-wrap xl:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => selectAllExportableVisible()}
              disabled={exportableVisible.length === 0 || packetPending || signingPending}
            >
              Select visible (has file)
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setSelected(new Set())}
              disabled={selected.size === 0 || packetPending || signingPending}
            >
              Clear
            </Button>
            <span className="font-sans text-sm text-neutral-600">{selected.size} selected</span>
          </div>
          <label className="flex flex-col gap-1 font-sans text-xs text-neutral-600">
            Signer email (optional override)
            <input
              value={signerEmail}
              onChange={(e) => setSignerEmail(e.target.value)}
              type="email"
              autoComplete="email"
              className="h-9 w-[min(260px,100%)] rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-sm text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              placeholder="Defaults to your profile email"
              disabled={signingPending}
            />
          </label>
          <label className="flex flex-col gap-1 font-sans text-xs text-neutral-600">
            Signer display name (optional)
            <input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              type="text"
              autoComplete="name"
              className="h-9 w-[min(220px,100%)] rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-sm text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
              disabled={signingPending}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="gold"
              size="sm"
              onClick={() => exportPacketZip()}
              disabled={packetPending || signingPending || selected.size === 0}
            >
              {packetPending ? "Building ZIP…" : "Export ZIP packet"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => sendForSigning()}
              disabled={signingPending || packetPending || selected.size === 0}
            >
              {signingPending ? "Sending…" : "Send for signature"}
            </Button>
          </div>
        </div>

        {workflowMessage ? (
          <p className="mt-3 font-sans text-sm text-brand-navy">{workflowMessage}</p>
        ) : null}

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
              <div key={d.id} className="relative flex flex-col gap-2">
                <input
                  type="checkbox"
                  className="absolute left-3 top-3 z-10 h-4 w-4 rounded border-neutral-400 text-brand-navy shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
                  checked={selected.has(d.id)}
                  disabled={!d.can_export}
                  onChange={() => toggleDocSelect(d.id)}
                  aria-label={`Select ${d.file_name ?? "document"} for packet export or signing`}
                />
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
                <th className="px-3 py-2 font-sans text-xs uppercase tracking-wide text-neutral-600">
                  Packet
                </th>
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
                    <td className="px-3 py-2 font-sans text-sm text-neutral-900">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-neutral-400 text-brand-navy"
                        checked={selected.has(d.id)}
                        disabled={!d.can_export}
                        onChange={() => toggleDocSelect(d.id)}
                        aria-label={`Select ${d.file_name ?? "document"}`}
                      />
                      {!d.can_export ? (
                        <span className="sr-only">No file uploaded yet.</span>
                      ) : null}
                    </td>
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
