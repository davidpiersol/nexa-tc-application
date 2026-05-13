"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type PackageKind = "seller" | "buyer" | "title";

type ItemType = "global_template" | "broker_upload" | "title_upload";

type RuleItemRow = {
  id: string;
  rule_id: string;
  sort_order: number;
  item_type: ItemType;
  global_document_template_id: string | null;
  placeholder_label: string | null;
};

type RuleRow = {
  id: string;
  tenant_id: string | null;
  package_kind: PackageKind;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  document_package_rule_items?: RuleItemRow[];
};

type TemplateOption = { id: string; form_number: string; title: string };

type DraftItem =
  | { itemType: "global_template"; sortOrder: number; templateId: string }
  | { itemType: "broker_upload"; sortOrder: number; placeholderLabel: string }
  | { itemType: "title_upload"; sortOrder: number; placeholderLabel: string };

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function GlobalPackageRulesConsole() {
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);

  async function refresh() {
    const res = await fetch("/api/admin/global/package-rules", { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as { rules?: RuleRow[]; error?: string };
    if (!res.ok) {
      setMsg(body.error ?? "Could not load package rules");
      return;
    }
    setRules(body.rules ?? []);
  }

  async function loadTemplates() {
    const res = await fetch("/api/admin/global/templates", { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as {
      templates?: { id: string; form_number: string; title: string }[];
    };
    if (!res.ok) return;
    const rows = body.templates ?? [];
    setTemplates(rows.map((t) => ({ id: t.id, form_number: t.form_number, title: t.title })));
  }

  useEffect(() => {
    void refresh();
    void loadTemplates();
  }, []);

  function addDraftRow(kind: ItemType) {
    const sortOrder = draftItems.length;
    if (kind === "global_template") {
      const first = templates[0]?.id ?? "";
      setDraftItems((prev) => [
        ...prev,
        { itemType: "global_template", sortOrder, templateId: first },
      ]);
      return;
    }
    setDraftItems((prev) => [
      ...prev,
      {
        itemType: kind,
        sortOrder,
        placeholderLabel: "",
      },
    ]);
  }

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
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
    const packageKind = String(form.get("packageKind") ?? "seller") as PackageKind;
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();

    const validDraft = draftItems.filter((row) => {
      if (row.itemType === "global_template") return Boolean(row.templateId);
      return row.placeholderLabel.trim().length > 0;
    });

    const items = validDraft.map((row, index) => {
      const sortOrder = index;
      if (row.itemType === "global_template") {
        return { itemType: "global_template" as const, sortOrder, templateId: row.templateId };
      }
      if (row.itemType === "broker_upload") {
        return {
          itemType: "broker_upload" as const,
          sortOrder,
          placeholderLabel: row.placeholderLabel.trim(),
        };
      }
      return {
        itemType: "title_upload" as const,
        sortOrder,
        placeholderLabel: row.placeholderLabel.trim(),
      };
    });

    const res = await fetch("/api/admin/global/package-rules", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        packageKind,
        name,
        slug,
        description: description || undefined,
        isActive: true,
        items,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Create failed");
      return;
    }
    e.currentTarget.reset();
    setDraftItems([]);
    await refresh();
    setMsg("Package rule created.");
  }

  const templateById = useMemo(() => {
    const m = new Map<string, TemplateOption>();
    for (const t of templates) m.set(t.id, t);
    return m;
  }, [templates]);

  return (
    <div className="space-y-8">
      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-brand-md border border-neutral-200 bg-white p-4"
      >
        <h3 className="font-display text-lg text-brand-navy">Create package rule</h3>
        <p className="font-sans text-xs text-neutral-600">
          Seller, buyer, and title packages can mix NMAR templates with broker- or title-specific
          upload placeholders.
        </p>
        <label className="flex flex-col gap-1.5">
          <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Package kind
          </span>
          <select
            name="packageKind"
            required
            className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-sm text-neutral-900 shadow-brand-sm"
          >
            <option value="seller">Seller package</option>
            <option value="buyer">Buyer package</option>
            <option value="title">Title package</option>
          </select>
        </label>
        <Input label="Name" name="name" required placeholder="NM default seller packet" />
        <Input
          label="Slug"
          name="slug"
          required
          placeholder="nm-default-seller"
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
        />
        <Input label="Description (optional)" name="description" placeholder="Internal notes" />
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => addDraftRow("global_template")}>
              Add template item
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => addDraftRow("broker_upload")}>
              Add broker upload slot
            </Button>
            <Button type="button" size="sm" variant="secondary" onClick={() => addDraftRow("title_upload")}>
              Add title upload slot
            </Button>
          </div>
          {draftItems.map((row, idx) => (
            <div
              key={`${row.itemType}-${idx}`}
              className="rounded-brand-md border border-neutral-200 p-2 font-sans text-sm"
            >
              {row.itemType === "global_template" ? (
                <label className="grid gap-1">
                  <span className="text-xs text-neutral-600">Global template</span>
                  <select
                    className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 text-sm"
                    value={row.templateId}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDraftItems((prev) =>
                        prev.map((r, i) =>
                          i === idx && r.itemType === "global_template"
                            ? { ...r, templateId: v }
                            : r,
                        ),
                      );
                    }}
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.form_number} · {t.title}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <Input
                  label={row.itemType === "broker_upload" ? "Broker upload label" : "Title upload label"}
                  value={row.placeholderLabel}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftItems((prev) =>
                      prev.map((r, i) =>
                        i === idx && r.itemType !== "global_template"
                          ? { ...r, placeholderLabel: v }
                          : r,
                      ),
                    );
                  }}
                  placeholder="e.g. Firm-specific addendum"
                />
              )}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="mt-2"
                onClick={() => setDraftItems((prev) => prev.filter((_, i) => i !== idx))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        <Button type="submit" variant="gold" disabled={busy}>
          Save package rule
        </Button>
      </form>

      <section className="rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="font-display text-lg text-brand-navy">Existing rules</h3>
        <div className="mt-3 space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-brand-md border border-neutral-100 p-3">
              <p className="font-semibold text-brand-navy">
                {rule.name}{" "}
                <span className="font-normal text-neutral-600">
                  ({rule.package_kind} · {rule.slug})
                </span>
              </p>
              {rule.description ? (
                <p className="mt-1 font-sans text-xs text-neutral-600">{rule.description}</p>
              ) : null}
              <ul className="mt-2 list-disc pl-5 font-sans text-sm text-neutral-800">
                {(rule.document_package_rule_items ?? [])
                  .slice()
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((item) => (
                    <li key={item.id}>
                      {item.item_type === "global_template" ? (
                        <>
                          Template:{" "}
                          {item.global_document_template_id
                            ? templateById.get(item.global_document_template_id)?.form_number ??
                              item.global_document_template_id
                            : "—"}
                        </>
                      ) : (
                        <>
                          {item.item_type === "broker_upload" ? "Broker upload" : "Title upload"}:{" "}
                          {item.placeholder_label}
                        </>
                      )}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
          {rules.length === 0 ? (
            <p className="font-sans text-sm text-neutral-600">No package rules yet.</p>
          ) : null}
        </div>
      </section>

      {msg ? <p className="font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}
