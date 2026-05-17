"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import {
  assignmentCategoryLabel,
  TRANSACTION_CONTACT_ROLES,
  transactionContactRoleLabel,
  type TransactionContactRole,
} from "@/lib/transactions/contact-assignment";
import { contactCategoryLabel, isContactCategory, type ContactCategory } from "@/lib/contacts/categories";

type ContactLookup = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  categories: string[];
};

type AssignmentRow = {
  id: string;
  transactionId: string;
  contactId: string;
  assignmentRole: TransactionContactRole;
  assignmentCategory: ContactCategory | null;
  notes: string | null;
  contact: {
    id: string;
    fullName: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
  } | null;
};

const SERVICE_PROVIDER_CATEGORIES: ContactCategory[] = [
  "vendor",
  "lender",
  "title",
  "attorney",
  "broker",
];

async function getCsrfToken(): Promise<string | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  return json.csrfToken ?? null;
}

export function TransactionContactAssignmentsClient({
  transactionId,
  initialAssignments,
  contactOptions,
}: {
  transactionId: string;
  initialAssignments: AssignmentRow[];
  contactOptions: ContactLookup[];
}) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<AssignmentRow[]>(initialAssignments);
  const [contactId, setContactId] = useState("");
  const [assignmentRole, setAssignmentRole] = useState<TransactionContactRole>("vendor");
  const [assignmentCategory, setAssignmentCategory] = useState<ContactCategory | "">("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerCategorySet = useMemo(() => new Set(SERVICE_PROVIDER_CATEGORIES), []);
  const providerContacts = useMemo(
    () =>
      contactOptions.filter((contact) =>
        contact.categories.some((category) => providerCategorySet.has(category as ContactCategory)),
      ),
    [contactOptions, providerCategorySet],
  );

  const sortedAssignments = useMemo(
    () =>
      [...assignments].sort((a, b) => {
        const byRole = transactionContactRoleLabel(a.assignmentRole).localeCompare(
          transactionContactRoleLabel(b.assignmentRole),
        );
        if (byRole !== 0) return byRole;
        return (a.contact?.fullName ?? "").localeCompare(b.contact?.fullName ?? "");
      }),
    [assignments],
  );

  async function refreshAssignments() {
    const res = await fetch(`/api/transactions/${transactionId}/contacts`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error("Could not refresh assignments.");
    const body = (await res.json()) as { assignments?: AssignmentRow[] };
    setAssignments(body.assignments ?? []);
  }

  async function assignContact() {
    const token = await getCsrfToken();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }
    if (!contactId) {
      setError("Choose a contact before assigning.");
      return;
    }
    const res = await fetch(`/api/transactions/${transactionId}/contacts`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({
        contactId,
        assignmentRole,
        assignmentCategory: assignmentCategory || undefined,
        notes,
      }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not assign vendor.");
      return;
    }
    setContactId("");
    setAssignmentRole("vendor");
    setAssignmentCategory("");
    setNotes("");
    await refreshAssignments();
    router.refresh();
  }

  async function removeAssignment(assignmentId: string) {
    const token = await getCsrfToken();
    if (!token) {
      setError("Could not load CSRF token.");
      return;
    }
    const confirmed = window.confirm(
      "Remove this transaction contact assignment? This will not delete the contact profile.",
    );
    if (!confirmed) return;
    const res = await fetch(`/api/transactions/${transactionId}/contacts`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({ assignmentId }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Could not remove assignment.");
      return;
    }
    await refreshAssignments();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">Assign Vendors and Service Providers</h3>
        <p className="mt-2 font-sans text-sm text-neutral-600">
          Assign canonical contact records to this transaction by workflow role. Removing an assignment does not
          delete the contact.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <SearchableSelect
            label="Contact"
            value={contactId}
            onValueChange={setContactId}
            disabled={busy}
            placeholder="Search service provider contacts"
            options={providerContacts.map((contact) => {
              const categoryLabel =
                contact.categories.length > 0
                  ? contact.categories
                      .map((category) =>
                        isContactCategory(category) ? contactCategoryLabel(category) : category,
                      )
                      .join(", ")
                  : "Uncategorized";
              return {
                value: contact.id,
                label: `${contact.fullName || "Unnamed"} · ${categoryLabel}`,
                keywords: contact.categories,
              };
            })}
          />

          <label className="flex flex-col gap-1 font-sans text-sm">
            <span className="text-neutral-700">Assignment role</span>
            <select
              className="rounded border border-neutral-300 bg-white px-3 py-2"
              value={assignmentRole}
              onChange={(event) => setAssignmentRole(event.target.value as TransactionContactRole)}
              disabled={busy}
            >
              {TRANSACTION_CONTACT_ROLES.map((role) => (
                <option key={role} value={role}>
                  {transactionContactRoleLabel(role)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 font-sans text-sm">
            <span className="text-neutral-700">Category context (optional)</span>
            <select
              className="rounded border border-neutral-300 bg-white px-3 py-2"
              value={assignmentCategory}
              onChange={(event) => setAssignmentCategory((event.target.value || "") as ContactCategory | "")}
              disabled={busy}
            >
              <option value="">Use contact defaults</option>
              {SERVICE_PROVIDER_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {contactCategoryLabel(category)}
                </option>
              ))}
              <option value="other">Other</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 font-sans text-sm">
            <span className="text-neutral-700">Notes (optional)</span>
            <input
              className="rounded border border-neutral-300 bg-white px-3 py-2"
              value={notes}
              maxLength={500}
              onChange={(event) => setNotes(event.target.value)}
              disabled={busy}
            />
          </label>
        </div>

        <div className="mt-4">
          <Button
            variant="gold"
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError(null);
              try {
                await assignContact();
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "Assigning…" : "Assign vendor"}
          </Button>
          {error ? <p className="mt-2 font-sans text-xs text-status-danger">{error}</p> : null}
        </div>
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">Assigned transaction contacts</h3>
        <ul className="mt-4 space-y-3">
          {sortedAssignments.length === 0 ? (
            <li className="font-sans text-sm text-neutral-600">No assigned vendors or service providers yet.</li>
          ) : null}
          {sortedAssignments.map((assignment) => (
            <li
              key={assignment.id}
              className="flex flex-col gap-2 rounded-brand-md border border-neutral-200 px-3 py-2 md:flex-row md:items-start md:justify-between"
            >
              <div className="font-sans text-sm text-neutral-900">
                <p className="font-semibold text-brand-navy">
                  {assignment.contact?.fullName ?? "Removed contact"} ·{" "}
                  {transactionContactRoleLabel(assignment.assignmentRole)}
                </p>
                <p className="text-neutral-600">
                  {assignment.contact?.company || "No company"} ·{" "}
                  {assignment.contact?.email || assignment.contact?.phone || "No direct contact info"}
                </p>
                <p className="text-neutral-600">
                  Category context · {assignmentCategoryLabel(assignment.assignmentCategory)}
                </p>
                {assignment.notes ? <p className="text-neutral-600">Notes · {assignment.notes}</p> : null}
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  setError(null);
                  try {
                    await removeAssignment(assignment.id);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Remove
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
