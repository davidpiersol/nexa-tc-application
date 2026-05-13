"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CANONICAL_FIELD_PICKER_OPTIONS } from "@/lib/documents/template-field-mapping";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type TemplateVersion = {
  id: string;
  version_label: string;
  review_status: string;
  mapping_review_status?: string;
  is_current: boolean;
  fillable_field_names?: string[] | null;
  field_mappings?: Record<string, string> | null;
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

type MappingSuggestionRow = {
  id: string;
  suggested_mappings: Record<string, string>;
  confidence: number | null;
  status: string;
  model_name: string | null;
  rationale: string | null;
  created_at: string;
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
  const [selectedVersionId, setSelectedVersionId] = useState<string>("");
  const [mappingDraft, setMappingDraft] = useState<Record<string, string>>({});
  const [mappingSuggestions, setMappingSuggestions] = useState<MappingSuggestionRow[]>([]);
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
  const versions = useMemo(
    () => selected?.global_document_template_versions ?? [],
    [selected],
  );
  const selectedVersion = versions.find((version) => version.id === selectedVersionId) ?? null;

  useEffect(() => {
    if (!versions.length) {
      setSelectedVersionId("");
      return;
    }
    if (!versions.some((version) => version.id === selectedVersionId)) {
      setSelectedVersionId(versions[0]?.id ?? "");
    }
  }, [selectedVersionId, versions]);

  useEffect(() => {
    if (!selectedVersion) {
      setMappingDraft({});
      return;
    }
    setMappingDraft(selectedVersion.field_mappings ?? {});
  }, [selectedVersion]);

  const loadMappingSuggestions = useCallback(async () => {
    if (!selectedTemplateId || !selectedVersionId) {
      setMappingSuggestions([]);
      return;
    }
    const res = await fetch(
      `/api/admin/global/templates/${selectedTemplateId}/versions/${selectedVersionId}/mapping-suggestions`,
      { credentials: "include" },
    );
    const body = (await res.json().catch(() => ({}))) as {
      suggestions?: MappingSuggestionRow[];
      error?: string;
    };
    if (!res.ok) {
      setMappingSuggestions([]);
      return;
    }
    setMappingSuggestions(body.suggestions ?? []);
  }, [selectedTemplateId, selectedVersionId]);

  useEffect(() => {
    void loadMappingSuggestions();
  }, [loadMappingSuggestions]);

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

  async function updateVersion(
    versionId: string,
    action:
      | "save_mappings"
      | "approve_mappings"
      | "approve_and_make_current"
      | "set_current"
      | "deactivate",
  ) {
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
        body: JSON.stringify(
          action === "save_mappings" ? { action, mappings: mappingDraft } : { action },
        ),
      },
    );
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Version update failed");
      return;
    }
    await refresh();
    await loadMappingSuggestions();
    setMsg("Version updated.");
  }

  async function requestAiMappingSuggestion() {
    if (!selectedTemplateId || !selectedVersionId) return;
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) {
      setBusy(false);
      setMsg("Could not load CSRF token.");
      return;
    }
    const res = await fetch(
      `/api/admin/global/templates/${selectedTemplateId}/versions/${selectedVersionId}/mapping-suggestions`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({}),
      },
    );
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    setBusy(false);
    if (!res.ok) {
      setMsg(
        body.message ??
          body.error ??
          (res.status === 503 ? "AI unavailable (check ANTHROPIC_API_KEY)." : "AI suggestion failed"),
      );
      return;
    }
    await refresh();
    await loadMappingSuggestions();
    setMsg("AI suggestion recorded (pending review). Not applied until approved.");
  }

  async function patchSuggestion(suggestionId: string, action: "approve_apply" | "reject") {
    if (!selectedTemplateId || !selectedVersionId) return;
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) {
      setBusy(false);
      setMsg("Could not load CSRF token.");
      return;
    }
    const res = await fetch(
      `/api/admin/global/templates/${selectedTemplateId}/versions/${selectedVersionId}/mapping-suggestions/${suggestionId}`,
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
    const body = (await res.json().catch(() => ({}))) as { error?: string; details?: string[] };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.details?.join(", ") ?? body.error ?? "Suggestion update failed");
      return;
    }
    await refresh();
    await loadMappingSuggestions();
    setMsg(action === "approve_apply" ? "Approved suggestion applied as draft mappings (needs review)." : "Suggestion rejected.");
  }

  function onMappingChange(pdfField: string, canonicalField: string) {
    setMappingDraft((prev) => {
      if (!canonicalField) {
        const next = { ...prev };
        delete next[pdfField];
        return next;
      }
      return { ...prev, [pdfField]: canonicalField };
    });
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
              <div
                key={version.id}
                className={`rounded-brand-md border p-3 ${
                  version.id === selectedVersionId
                    ? "border-brand-gold bg-brand-brown-pale"
                    : "border-neutral-200"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedVersionId(version.id)}
                  className="w-full text-left"
                >
                  <p className="font-sans text-sm font-semibold text-brand-navy">
                    {version.version_label}
                  </p>
                  <p className="font-sans text-xs text-neutral-600">
                    review: {version.review_status} · mapping:{" "}
                    {version.mapping_review_status ?? "needs_review"}{" "}
                    {version.is_current ? "· current" : ""}
                  </p>
                </button>
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
                    onClick={() => void updateVersion(version.id, "approve_mappings")}
                  >
                    Approve mappings
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

          {selectedVersion ? (
            <Fragment>
              <div className="rounded-brand-md border border-neutral-200 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-sans text-sm font-semibold text-brand-navy">
                    Field mapping · {selectedVersion.version_label}
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="gold"
                    disabled={busy}
                    onClick={() => void updateVersion(selectedVersion.id, "save_mappings")}
                  >
                    Save mappings
                  </Button>
                </div>
                <p className="mt-1 font-sans text-xs text-neutral-600">
                  Map each PDF field to a canonical transaction field.
                </p>

                <div className="mt-3 space-y-2">
                  {(selectedVersion.fillable_field_names ?? []).map((pdfField) => (
                    <label
                      key={pdfField}
                      className="grid gap-1 rounded-brand-md border border-neutral-200 p-2"
                    >
                      <span className="font-mono text-xs text-neutral-700">{pdfField}</span>
                      <select
                        value={mappingDraft[pdfField] ?? ""}
                        onChange={(e) => onMappingChange(pdfField, e.target.value)}
                        className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-sm text-neutral-900 shadow-brand-sm"
                      >
                        <option value="">Not mapped</option>
                        <optgroup label="Transaction fields">
                          {CANONICAL_FIELD_PICKER_OPTIONS.filter(
                            (option) => option.group === "transaction",
                          ).map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Intake data fields">
                          {CANONICAL_FIELD_PICKER_OPTIONS.filter(
                            (option) => option.group === "intake_data",
                          ).map((option) => (
                            <option key={option.key} value={option.key}>
                              {option.label}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </label>
                  ))}
                  {(selectedVersion.fillable_field_names ?? []).length === 0 ? (
                    <p className="font-sans text-sm text-neutral-600">
                      No fillable fields detected for this template version.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-brand-md border border-neutral-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-sans text-sm font-semibold text-brand-navy">
                      AI-assisted mapping
                    </p>
                    <p className="mt-1 font-sans text-xs text-neutral-600">
                      After at least one manual mapping is saved, you can request suggestions. AI
                      never auto-applies; approve to load mappings as a draft for further editing.
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={
                      busy ||
                      (selectedVersion.fillable_field_names ?? []).length === 0 ||
                      Object.keys(selectedVersion.field_mappings ?? {}).length === 0
                    }
                    onClick={() => void requestAiMappingSuggestion()}
                  >
                    Request AI suggestion
                  </Button>
                </div>

                <div className="mt-3 space-y-2">
                  {mappingSuggestions.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-brand-md border border-neutral-100 bg-neutral-50 p-2 font-sans text-xs text-neutral-800"
                    >
                      <p className="font-semibold text-brand-navy">
                        {s.status}
                        {s.confidence != null ? ` · confidence ${s.confidence.toFixed(2)}` : ""}
                        {s.model_name ? ` · ${s.model_name}` : ""}
                      </p>
                      {s.rationale ? <p className="mt-1 text-neutral-700">{s.rationale}</p> : null}
                      <p className="mt-1 font-mono text-[11px] text-neutral-600">
                        {JSON.stringify(s.suggested_mappings)}
                      </p>
                      {s.status === "pending" ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="gold"
                            disabled={busy}
                            onClick={() => void patchSuggestion(s.id, "approve_apply")}
                          >
                            Approve & apply as draft
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy}
                            onClick={() => void patchSuggestion(s.id, "reject")}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                  {mappingSuggestions.length === 0 ? (
                    <p className="font-sans text-xs text-neutral-600">No suggestions yet.</p>
                  ) : null}
                </div>
              </div>
            </Fragment>
          ) : null}
        </section>
      </div>

      {msg ? <p className="font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}
