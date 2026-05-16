"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

export function UatIssueForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const csrfRes = await fetch("/api/csrf", { credentials: "include" });
    const csrf = (await csrfRes.json()) as { csrfToken?: string };
    const res = await fetch("/api/uat-issues", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", [CSRF_HEADER_NAME]: csrf.csrfToken ?? "" },
      body: JSON.stringify({
        issueType: String(form.get("issueType") ?? "bug"),
        severity: String(form.get("severity") ?? "medium"),
        title: String(form.get("title") ?? ""),
        description: String(form.get("description") ?? ""),
        currentUrl: window.location.href,
      }),
    });
    setBusy(false);
    if (!res.ok) return setMessage("Could not submit the issue. Please try again.");
    event.currentTarget.reset();
    setMessage("Thank you — your UAT issue was submitted.");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 font-sans text-sm">
          <span className="text-neutral-700">Request type</span>
          <select name="issueType" defaultValue="bug" className="rounded border border-neutral-300 bg-white px-3 py-2">
            <option value="bug">Bug</option>
            <option value="enhancement">Enhancement request</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm">
          <span className="text-neutral-700">Severity</span>
          <select name="severity" defaultValue="medium" className="rounded border border-neutral-300 bg-white px-3 py-2">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="blocking">Blocking</option>
          </select>
        </label>
      </div>
      <Input label="Short title" name="title" required maxLength={180} />
      <label className="flex flex-col gap-1.5 font-sans text-sm">
        <span className="text-neutral-700">What happened, or what would you like changed?</span>
        <textarea name="description" required minLength={10} rows={7} className="rounded border border-neutral-300 bg-white px-3 py-2" placeholder="Please include what you were trying to do, what happened, and what you expected." />
      </label>
      <div className="flex items-center gap-3">
        <Button variant="gold" type="submit" loading={busy}>Submit UAT issue</Button>
        {message ? <p className="font-sans text-sm text-neutral-700">{message}</p> : null}
      </div>
    </form>
  );
}
