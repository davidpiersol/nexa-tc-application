"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import type { PropertyLookupSuggestion } from "@/lib/property-lookup/types";

type StoredSuggestion = PropertyLookupSuggestion & { id?: string };

export function PropertyLookupPanel({ transactionId, address }: { transactionId?: string; address?: string | null }) {
  const [county, setCounty] = useState("");
  const [manualText, setManualText] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<StoredSuggestion[]>([]);

  async function csrf() {
    const res = await fetch("/api/csrf", { credentials: "include" });
    const body = await res.json() as { csrfToken?: string };
    return body.csrfToken;
  }

  async function lookup() {
    setPending(true); setMessage(null);
    const token = await csrf();
    if (!token) { setMessage("Security token missing."); setPending(false); return; }
    const res = await fetch("/api/property-lookup", { method:"POST", credentials:"include", headers:{"Content-Type":"application/json",[CSRF_HEADER_NAME]:token}, body: JSON.stringify({ transactionId, address, county, manualText }) });
    const body = await res.json() as { suggestions?: StoredSuggestion[]; run?: { status?: string }; countySource?: { portal_type?: string } | null; error?: string };
    setPending(false);
    if (!res.ok) { setMessage(body.error ?? "Lookup failed."); return; }
    setSuggestions(body.suggestions ?? []);
    setMessage(body.run?.status === "manual_required" ? "No structured provider is configured yet. Paste assessor or GIS text to generate reviewable suggestions." : "Suggestions ready for human review.");
  }

  async function reviewSuggestion(id: string | undefined, accept: boolean) {
    if (!id) return;
    setPending(true);
    setMessage(null);
    const token = await csrf();
    if (!token) { setMessage("Security token missing."); setPending(false); return; }
    const res = await fetch(`/api/property-lookup/suggestions/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", [CSRF_HEADER_NAME]: token },
      body: JSON.stringify({ accept }),
    });
    setPending(false);
    if (!res.ok) { setMessage("Could not save review decision."); return; }
    setSuggestions((current) => current.filter((item) => item.id !== id));
    setMessage(accept ? "Suggestion accepted and saved." : "Suggestion rejected.");
  }

  return <section className="rounded-brand-md border border-neutral-200 p-4">
    <h4 className="font-display text-heading-md text-brand-navy">Statewide property lookup</h4>
    <p className="mt-2 text-sm text-neutral-600">Use a reviewed statewide provider when configured; otherwise paste assessor or GIS text and confirm each suggestion before saving.</p>
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <label className="flex flex-col gap-1.5"><span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">County</span><input value={county} onChange={(e)=>setCounty(e.target.value)} placeholder="Valencia" className="h-10 rounded-brand-md border border-neutral-300 bg-white px-3" /></label>
      <label className="flex flex-col gap-1.5 lg:col-span-2"><span className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">Paste assessor / GIS text</span><textarea value={manualText} onChange={(e)=>setManualText(e.target.value)} rows={4} className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2" placeholder={'Owner: Jane Doe\nParcel number: 123-ABC\nLegal description: Lot 4'} /></label>
    </div>
    <div className="mt-4"><Button type="button" variant="secondary" onClick={lookup} loading={pending}>Research property</Button></div>
    {message ? <p className="mt-3 text-sm text-neutral-600">{message}</p> : null}
    {suggestions.length ? <ul className="mt-4 flex flex-col gap-2">{suggestions.map((item)=> <li key={`${item.fieldKey}:${item.value}`} className="flex flex-col gap-3 rounded-brand-md bg-neutral-50 px-3 py-2 text-sm md:flex-row md:items-center md:justify-between"><span><span className="font-semibold">{item.fieldKey}</span>: {item.value} <span className="text-neutral-600">· review before saving</span></span>{item.id ? <span className="flex gap-2"><Button type="button" variant="secondary" size="sm" onClick={() => reviewSuggestion(item.id, true)} disabled={pending}>Accept</Button><Button type="button" variant="ghost" size="sm" onClick={() => reviewSuggestion(item.id, false)} disabled={pending}>Reject</Button></span> : null}</li>)}</ul> : null}
  </section>;
}
