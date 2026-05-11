"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  contactCategoryLabel,
  sortedContactCategoriesForUi,
  type ContactCategory,
} from "@/lib/contacts/categories";
import type { ContactRow } from "@/lib/contacts/types";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

const SALUTATION_OPTIONS = ["", "Mr.", "Mrs.", "Ms.", "Dr.", "Rev.", "Hon."] as const;
const SUFFIX_OPTIONS = ["", "Jr.", "Sr.", "II", "III", "IV", "Esq."] as const;
const BROKERAGE_OPTIONS = ["", "ReMax", "Coldwell Banker", "Keller Williams", "eXp Realty", "Other"] as const;

async function getCsrfToken(): Promise<string | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  return body.csrfToken ?? null;
}

type DeleteImpactResponse = {
  impact?: {
    intakeMatches?: Array<{
      transactionId: string;
      propertyAddress: string | null;
      mlsNumber: string | null;
      matchedFields: string[];
    }>;
    partyMatches?: Array<{
      transactionId: string;
      propertyAddress: string | null;
      mlsNumber: string | null;
      matchedFields: string[];
    }>;
    total?: number;
  };
};

export function ContactDetailConsole({
  contactId,
  brokerMode = false,
}: {
  contactId: string;
  brokerMode?: boolean;
}) {
  const router = useRouter();
  const [contact, setContact] = useState<ContactRow | null>(null);
  const [canManageCredentials, setCanManageCredentials] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showOtherCategory, setShowOtherCategory] = useState(false);
  const [showBrokerageOther, setShowBrokerageOther] = useState(false);

  const categoryOptions = sortedContactCategoriesForUi();

  async function refresh() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/contacts/${contactId}`, { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as {
      contact?: ContactRow;
      canManageCredentials?: boolean;
      error?: string;
    };
    if (!res.ok || !body.contact) {
      setError(body.error ?? "Could not load contact.");
      setContact(null);
      setLoading(false);
      return;
    }
    setContact(body.contact);
    setCanManageCredentials(Boolean(body.canManageCredentials));
    setShowOtherCategory(Boolean(body.contact.other_category_description));
    setShowBrokerageOther(body.contact.brokerProfile?.brokerage === "Other");
    setLoading(false);
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  if (loading) return <p className="font-sans text-sm text-neutral-600">Loading…</p>;
  if (!contact) return <p className="font-sans text-sm text-status-danger">{error ?? "Not found."}</p>;

  const detailBase = brokerMode ? "/tc/brokers" : "/tc/contacts";
  const address = [
    contact.address_line_1,
    contact.address_line_2,
    [contact.city, contact.state, contact.postal_code].filter(Boolean).join(", "),
    contact.country,
  ]
    .filter((part) => typeof part === "string" && part.trim().length > 0)
    .join(" · ");

  const nameParts = [
    contact.salutation,
    contact.first_name,
    contact.middle_name,
    contact.last_name,
    contact.suffix,
  ]
    .filter((part) => part && part.trim().length > 0)
    .join(" ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-heading-lg text-brand-navy">
          {brokerMode ? "Broker Profile" : "Contact Profile"}
        </h2>
        <Button variant="ghost" size="sm" asChild>
          <Link href={detailBase}>Back</Link>
        </Button>
      </div>

      {editing ? (
        <form
          className="grid grid-cols-1 gap-4 rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm lg:grid-cols-2"
          onSubmit={async (event) => {
            event.preventDefault();
            setError(null);
            setSaved(false);
            setSaving(true);
            try {
              const form = new FormData(event.currentTarget);
              const token = await getCsrfToken();
              if (!token) {
                setError("Could not load CSRF token.");
                return;
              }
              const categories = categoryOptions.filter((category) =>
                form.getAll("categories").includes(category),
              ) as ContactCategory[];

              const brokerage = String(form.get("brokerage") ?? "").trim();
              const brokerageOther = String(form.get("brokerageOther") ?? "").trim();

              const payload = {
                salutation: String(form.get("salutation") ?? "").trim(),
                firstName: String(form.get("firstName") ?? "").trim(),
                middleName: String(form.get("middleName") ?? "").trim(),
                lastName: String(form.get("lastName") ?? "").trim(),
                suffix: String(form.get("suffix") ?? "").trim(),
                email: String(form.get("email") ?? "").trim(),
                phone: String(form.get("phone") ?? "").trim(),
                company: String(form.get("company") ?? "").trim(),
                addressLine1: String(form.get("addressLine1") ?? "").trim(),
                addressLine2: String(form.get("addressLine2") ?? "").trim(),
                city: String(form.get("city") ?? "").trim(),
                state: String(form.get("state") ?? "").trim(),
                postalCode: String(form.get("postalCode") ?? "").trim(),
                country: String(form.get("country") ?? "").trim(),
                notes: String(form.get("notes") ?? "").trim(),
                categories,
                otherCategoryDescription: String(form.get("otherCategoryDescription") ?? "").trim(),
                brokerProfile: brokerMode
                  ? {
                      brokerage: brokerage === "Other" ? brokerageOther : brokerage,
                      signingPlatform: String(form.get("signingPlatform") ?? "").trim(),
                      signingPreference: String(form.get("signingPreference") ?? "").trim(),
                      credentialProvider: String(form.get("credentialProvider") ?? "").trim(),
                      credentials:
                        canManageCredentials &&
                        String(form.get("credentialBlob") ?? "").trim().length > 0
                          ? { raw: String(form.get("credentialBlob") ?? "").trim() }
                          : undefined,
                    }
                  : undefined,
              };

              const res = await fetch(`/api/contacts/${contactId}`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                  "Content-Type": "application/json",
                  [CSRF_HEADER_NAME]: token,
                },
                body: JSON.stringify(payload),
              });
              const body = (await res.json().catch(() => ({}))) as { error?: string };
              if (!res.ok) {
                setError(body.error ?? "Could not save.");
                return;
              }
              setSaved(true);
              setEditing(false);
              await refresh();
              router.refresh();
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Salutation
            </span>
            <select
              name="salutation"
              defaultValue={contact.salutation ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            >
              {SALUTATION_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value || "None"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Suffix
            </span>
            <select
              name="suffix"
              defaultValue={contact.suffix ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            >
              {SUFFIX_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value || "None"}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              First name
            </span>
            <input
              name="firstName"
              required
              defaultValue={contact.first_name ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Middle name
            </span>
            <input
              name="middleName"
              defaultValue={contact.middle_name ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Last name
            </span>
            <input
              name="lastName"
              required
              defaultValue={contact.last_name ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Company</span>
            <input
              name="company"
              defaultValue={contact.company ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Email</span>
            <input
              name="email"
              defaultValue={contact.email ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Phone</span>
            <input
              name="phone"
              defaultValue={contact.phone ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5 lg:col-span-2">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Address line 1
            </span>
            <input
              name="addressLine1"
              defaultValue={contact.address_line_1 ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5 lg:col-span-2">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Address line 2
            </span>
            <input
              name="addressLine2"
              defaultValue={contact.address_line_2 ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">City</span>
            <input
              name="city"
              defaultValue={contact.city ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">State</span>
            <input
              name="state"
              defaultValue={contact.state ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">ZIP</span>
            <input
              name="postalCode"
              defaultValue={contact.postal_code ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Country</span>
            <input
              name="country"
              defaultValue={contact.country ?? ""}
              className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
            />
          </label>

          <fieldset className="rounded-brand-md border border-neutral-200 p-3 lg:col-span-2">
            <legend className="px-1 font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Categories
            </legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {categoryOptions.map((category) => (
                <label key={category} className="flex items-center gap-2 font-sans text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    name="categories"
                    value={category}
                    defaultChecked={contact.categories.includes(category)}
                    onChange={(event) => {
                      if (category === "other") setShowOtherCategory(event.currentTarget.checked);
                    }}
                    className="size-4 accent-brand-gold"
                  />
                  <span>{contactCategoryLabel(category)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {showOtherCategory ? (
            <label className="flex flex-col gap-1.5 lg:col-span-2">
              <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                Other category description
              </span>
              <input
                name="otherCategoryDescription"
                defaultValue={contact.other_category_description ?? ""}
                className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
              />
            </label>
          ) : null}

          {brokerMode ? (
            <>
              <label className="flex flex-col gap-1.5">
                <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                  Brokerage
                </span>
                <select
                  name="brokerage"
                  defaultValue={contact.brokerProfile?.brokerage ?? ""}
                  onChange={(event) => setShowBrokerageOther(event.currentTarget.value === "Other")}
                  className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
                >
                  {BROKERAGE_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {value || "Select brokerage"}
                    </option>
                  ))}
                </select>
              </label>
              {showBrokerageOther ? (
                <label className="flex flex-col gap-1.5">
                  <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                    Brokerage (other)
                  </span>
                  <input
                    name="brokerageOther"
                    className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
                  />
                </label>
              ) : (
                <div />
              )}
              <label className="flex flex-col gap-1.5">
                <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                  Signing platform
                </span>
                <input
                  name="signingPlatform"
                  defaultValue={contact.brokerProfile?.signingPlatform ?? ""}
                  className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                  Signing preference
                </span>
                <input
                  name="signingPreference"
                  defaultValue={contact.brokerProfile?.signingPreference ?? ""}
                  className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
                />
              </label>

              {canManageCredentials ? (
                <>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                      Credential provider
                    </span>
                    <input
                      name="credentialProvider"
                      placeholder="docusign"
                      className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5">
                    <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                      Credential secret blob
                    </span>
                    <input
                      name="credentialBlob"
                      placeholder={
                        contact.brokerProfile?.hasCredentials
                          ? "Stored (enter to replace)"
                          : "Paste token/secret"
                      }
                      className="h-10 rounded-brand-md border border-neutral-300 px-3 font-sans text-ui-body"
                    />
                  </label>
                </>
              ) : (
                <p className="lg:col-span-2 font-sans text-xs text-neutral-600">
                  Credential fields are restricted to tenant/global admins.
                </p>
              )}
            </>
          ) : null}

          <label className="flex flex-col gap-1.5 lg:col-span-2">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Notes
            </span>
            <textarea
              name="notes"
              rows={4}
              defaultValue={contact.notes ?? ""}
              className="rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-ui-body"
            />
          </label>

          {error ? <p className="lg:col-span-2 font-sans text-sm text-status-danger">{error}</p> : null}
          {saved ? <p className="lg:col-span-2 font-sans text-sm text-status-success">Saved.</p> : null}
          <div className="flex gap-2 lg:col-span-2">
            <Button variant="gold" size="sm" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setEditing(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Info label="Name" value={nameParts || contact.full_name} />
            <Info label="Email" value={contact.email ?? "Not set"} />
            <Info label="Phone" value={contact.phone ?? "Not set"} />
            <Info label="Company" value={contact.company ?? "Not set"} />
            <Info label="Address" value={address || "Not set"} />
            <Info
              label="Categories"
              value={
                contact.categories.length
                  ? contact.categories.map((category) => contactCategoryLabel(category)).join(", ")
                  : "None"
              }
            />
            {contact.other_category_description ? (
              <Info label="Other category" value={contact.other_category_description} />
            ) : null}
            {brokerMode ? (
              <>
                <Info
                  label="Brokerage"
                  value={contact.brokerProfile?.brokerage || "Not set"}
                />
                <Info
                  label="Signing platform"
                  value={contact.brokerProfile?.signingPlatform || "Not set"}
                />
                <Info
                  label="Signing preference"
                  value={contact.brokerProfile?.signingPreference || "Not set"}
                />
              </>
            ) : null}
            <Info label="Notes" value={contact.notes ?? "Not set"} />
          </dl>
          {error ? <p className="mt-3 font-sans text-sm text-status-danger">{error}</p> : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setEditing(true)}>
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              type="button"
              onClick={async () => {
                let impactMessage = "";
                try {
                  const impactRes = await fetch(`/api/contacts/${contactId}/impact`, {
                    credentials: "include",
                  });
                  if (impactRes.ok) {
                    const impactBody = (await impactRes.json().catch(() => ({}))) as DeleteImpactResponse;
                    const intakeCount = impactBody.impact?.intakeMatches?.length ?? 0;
                    const partyCount = impactBody.impact?.partyMatches?.length ?? 0;
                    const total = impactBody.impact?.total ?? intakeCount + partyCount;
                    if (total > 0) {
                      const sample = [
                        ...(impactBody.impact?.intakeMatches ?? []),
                        ...(impactBody.impact?.partyMatches ?? []),
                      ]
                        .slice(0, 3)
                        .map((row) => row.propertyAddress ?? row.mlsNumber ?? row.transactionId)
                        .join("\n- ");
                      impactMessage =
                        `Potential references found:\n` +
                        `- Intake matches: ${intakeCount}\n` +
                        `- Party/email matches: ${partyCount}\n` +
                        (sample ? `\nExamples:\n- ${sample}\n` : "\n") +
                        "Deleting this contact removes the profile but does not rewrite transaction snapshots.\n\n";
                    }
                  }
                } catch {
                  // Fallback to default warning if impact lookup fails.
                }

                const confirmed = window.confirm(
                  `${impactMessage}Warning: you are deleting this record. This action cannot be undone. Continue?`,
                );
                if (!confirmed) return;
                setError(null);
                setSaving(true);
                try {
                  const token = await getCsrfToken();
                  if (!token) {
                    setError("Could not load CSRF token.");
                    return;
                  }
                  const res = await fetch(`/api/contacts/${contactId}`, {
                    method: "DELETE",
                    credentials: "include",
                    headers: { [CSRF_HEADER_NAME]: token },
                  });
                  const body = (await res.json().catch(() => ({}))) as { error?: string };
                  if (!res.ok) {
                    setError(body.error ?? "Could not delete.");
                    return;
                  }
                  router.push(detailBase);
                  router.refresh();
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              Delete
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{label}</dt>
      <dd className="mt-1 font-sans text-ui-body text-neutral-900">{value}</dd>
    </div>
  );
}
