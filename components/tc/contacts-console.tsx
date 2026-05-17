"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { contactCategoryLabel, type ContactCategory } from "@/lib/contacts/categories";
import type { ContactRow } from "@/lib/contacts/types";

export function ContactsConsole({ brokerOnly = false }: { brokerOnly?: boolean }) {
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh(nextQuery?: string) {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (brokerOnly) params.set("brokers", "1");
    const q = (nextQuery ?? query).trim();
    if (q) params.set("q", q);
    const res = await fetch(`/api/contacts?${params.toString()}`, {
      credentials: "include",
    });
    const body = (await res.json().catch(() => ({}))) as {
      contacts?: ContactRow[];
      error?: string;
    };
    if (!res.ok) {
      setError(body.error ?? "Could not load contacts.");
      setContacts([]);
    } else {
      setContacts(body.contacts ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    void refresh("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brokerOnly]);

  const sorted = useMemo(
    () => [...contacts].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    [contacts],
  );

  const detailBase = brokerOnly ? "/tc/brokers" : "/tc/contacts";

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex w-full flex-col gap-1.5 sm:max-w-xl">
            <span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
              Search {brokerOnly ? "brokers" : "contacts"}
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Name, email, phone, company, city, state"
              className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            />
          </label>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => void refresh()}>
              Search
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                void refresh("");
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <h3 className="font-display text-heading-md text-brand-navy">
          {brokerOnly ? "Brokers" : "Contacts"} ({sorted.length})
        </h3>
        {loading ? <p className="mt-3 font-sans text-sm text-neutral-600">Loading…</p> : null}
        {error ? <p className="mt-3 font-sans text-sm text-status-danger">{error}</p> : null}
        {!loading && sorted.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-neutral-600">No records found.</p>
        ) : null}
        <ul className="mt-4 flex flex-col gap-2">
          {sorted.map((contact) => (
            <li
              key={contact.id}
              className="rounded-brand-md border border-neutral-200 bg-neutral-50 transition-colors hover:bg-white"
            >
              <Link
                href={`${detailBase}/${contact.id}`}
                className="flex flex-col gap-2 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-sans text-sm font-semibold text-brand-navy underline-offset-4 hover:underline">
                    {contact.full_name}
                  </p>
                  <p className="font-sans text-xs text-neutral-600">
                    {contact.email ?? "no email"}
                    {contact.phone ? ` · ${contact.phone}` : ""}
                    {contact.company ? ` · ${contact.company}` : ""}
                  </p>
                  <p className="font-sans text-xs text-neutral-500">
                    {contact.categories.length
                      ? contact.categories
                          .map((category) => contactCategoryLabel(category as ContactCategory))
                          .join(", ")
                      : "No categories"}
                    {contact.other_category_description
                      ? ` · Other: ${contact.other_category_description}`
                      : ""}
                  </p>
                </div>
                <span className="font-display text-sm font-semibold text-brand-navy underline-offset-4">
                  Open
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
