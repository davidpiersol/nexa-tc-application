"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type TemplateVersion = {
  id: string;
  version_label: string;
  review_status: string;
  is_current: boolean;
  created_at: string;
};

type TemplateRow = {
  id: string;
  form_number: string;
  title: string;
  category: string;
  jurisdiction_state: string;
  availability_status: string;
  is_active: boolean;
  global_document_template_versions?: TemplateVersion[];
};

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function GlobalTemplateConsole() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/global/templates", {
      credentials: "include",
    });
    const body = (await res.json().catch(() => ({}))) as {
      templates?: TemplateRow[];
      error?: string;
    };
    if (!res.ok) {
      setMsg(body.error ?? "Could not load templates");
      return;
    }
    const rows = body.templates ?? [];
    setTemplates(rows);
    setSelectedTemplateId((prev) => prev || rows[0]?.id || "");
  }

  useEffect(() => {
    void refresh();
  }, []);

  const selected = templates.find((t) => t.id === selectedTemplateId) ?? null;
  const versions = selected?.global_document_template_versions ?? [];

  async function createTemplate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) {
      setBusy(false);
      setMsg("Could not load CSRF token.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/global/templates", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        formNumber: String(form.get("formNumber") ?? ""),
        title: String(form.get("title") ?? ""),
        category: String(form.get("category") ?? "other"),
        jurisdictionState: String(form.get("jurisdictionState") ?? "NM"),
        isActive: String(form.get("isActive") ?? "") === "on",
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Create template failed");
      return;
    }
    e.currentTarget.reset();
    await refresh();
    setMsg("Template created.");
  }

  async function uploadVersion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTemplateId) {
      setMsg("Select a template first.");
      return;
    }
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) {
      setBusy(false);
      setMsg("Could not load CSRF token.");
      return;
    }
    const form = new FormData(e.currentTarget);
    const res = await fetch(`/api/admin/global/templates/${selectedTemplateId}/versions`, {
      method: "POST",
      credentials: "include",
      headers,
      body: form,
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Upload failed");
      return;
    }
    e.currentTarget.reset();
    await refresh();
    setMsg("Version uploaded (needs_review).");
  }

  async function updateVersion(versionId: string, action: string) {
    if (!selectedTemplateId) return;
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) {
      setBusy(false);
      setMsg("Could not load CSRF token.");
      return;
    }
    const res = await fetch(
      `/api/admin/global/templates/${selectedTemplateId}/versions/${versionId}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ action }),
      },
    );
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Version update failed");
      return;
    }
    await refresh();
    setMsg("Version updated.");
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={createTemplate}
        className="grid gap-3 rounded-brand-md border border-neutral-200 bg-white p-4"
      >
        <h3 className="font-display text-lg text-brand-navy">
          Create template record
        </h3>
        <Input label="Form number" name="formNumber" required />
        <Input label="Title" name="title" required />
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Category
          </span>
          <select
            name="category"
            defaultValue="other"
            className="w-full rounded-brand-md border border-neutral-300 bg-white px-3 py-2 font-sans text-sm text-neutral-900 shadow-brand-sm"
          >
            <option value="contract">Contract</option>
            <option value="disclosure">Disclosure</option>
            <option value="title">Title</option>
            <option value="mortgage">Mortgage</option>
            <option value="inspection">Inspection</option>
            <option value="hoa">HOA</option>
            <option value="other">Other</option>
          </select>
        </label>
        <Input label="Jurisdiction / State" name="jurisdictionState" defaultValue="NM" />
        <label className="flex items-center gap-2 font-sans text-sm text-neutral-900">
          <input type="checkbox" name="isActive" defaultChecked className="size-4 accent-brand-gold" />
          Active
        </label>
        <Button type="submit" variant="gold" disabled={busy}>
          Save template
        </Button>
      </form>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-brand-md border border-neutral-200 bg-white p-4">
          <h3 className="font-display text-lg text-brand-navy">Templates</h3>
          <div className="mt-3 space-y-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => setSelectedTemplateId(template.id)}
                className={`w-full rounded-brand-md border px-3 py-2 text-left font-sans text-sm ${
                  template.id === selectedTemplateId
                    ? "border-brand-gold bg-brand-brown-pale"
                    : "border-neutral-200 bg-white"
                }`}
              >
                <p className="font-semibold text-brand-navy">
                  {template.form_number} · {template.title}
                </p>
                <p className="text-neutral-600">
                  {template.category} · {template.jurisdiction_state} ·{" "}
                  {template.availability_status}
                </p>
              </button>
            ))}
            {templates.length === 0 ? (
              <p className="font-sans text-sm text-neutral-600">No templates yet.</p>
            ) : null}
          </div>
        </section>

        <section className="space-y-3 rounded-brand-md border border-neutral-200 bg-white p-4">
          <h3 className="font-display text-lg text-brand-navy">Template versions</h3>
          <form onSubmit={uploadVersion} className="grid gap-2">
            <Input label="Version label" name="versionLabel" placeholder="v2026-05-11" required />
            <label className="font-sans text-sm text-neutral-900">
              PDF file
              <input
                name="file"
                type="file"
                accept="application/pdf"
                required
                className="mt-1 block w-full text-sm"
              />
            </label>
            <Button type="submit" variant="secondary" disabled={busy || !selectedTemplateId}>
              Upload version
            </Button>
          </form>

          <div className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="rounded-brand-md border border-neutral-200 p-3">
                <p className="font-sans text-sm font-semibold text-brand-navy">
                  {version.version_label}
                </p>
                <p className="font-sans text-xs text-neutral-600">
                  {version.review_status} {version.is_current ? "· current" : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="gold"
                    disabled={busy}
                    onClick={() => void updateVersion(version.id, "approve_and_make_current")}
                  >
                    Approve + make current
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void updateVersion(version.id, "set_current")}
                  >
                    Set current
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void updateVersion(version.id, "deactivate")}
                  >
                    Deactivate
                  </Button>
                </div>
              </div>
            ))}
            {selectedTemplateId && versions.length === 0 ? (
              <p className="font-sans text-sm text-neutral-600">
                No versions uploaded yet.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {msg ? <p className="font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}
