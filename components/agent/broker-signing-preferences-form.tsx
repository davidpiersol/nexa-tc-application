"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

async function getCsrf(): Promise<string | undefined> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  return json.csrfToken;
}

export function BrokerSigningPreferencesForm({
  initialSigningPlatform,
  initialSigningPreferencesJson,
}: {
  initialSigningPlatform: string | null;
  initialSigningPreferencesJson: string;
}) {
  const [platform, setPlatform] = React.useState(initialSigningPlatform ?? "");
  const [prefsJson, setPrefsJson] = React.useState(initialSigningPreferencesJson);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    let prefs: Record<string, unknown>;
    try {
      prefs = JSON.parse(prefsJson || "{}") as Record<string, unknown>;
    } catch {
      setError("Signing preferences must be valid JSON.");
      return;
    }

    const token = await getCsrf();
    if (!token) {
      setError("Security token missing. Refresh and try again.");
      return;
    }

    setPending(true);
    const res = await fetch("/api/me/broker-profile", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: token,
      },
      body: JSON.stringify({
        signing_platform: platform.trim() || null,
        signing_preferences: prefs,
      }),
    });
    setPending(false);

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Save failed");
      return;
    }
    setMessage("Saved.");
  }

  return (
    <form
      onSubmit={onSave}
      className="mt-8 space-y-4 rounded-brand-md border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <h3 className="font-display text-heading-md text-brand-navy">Signing preferences</h3>
      <p className="font-sans text-sm text-neutral-600">
        TC-visible defaults for coordinated packets; DocuSign routing still follows tenant integration
        setup.
      </p>
      <label className="block font-sans text-sm">
        <span className="font-semibold text-brand-navy">Signing platform label</span>
        <input
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="mt-1 w-full rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-sm text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
          placeholder="e.g. DocuSign, Dotloop, Manual"
          maxLength={120}
        />
      </label>
      <label className="block font-sans text-sm">
        <span className="font-semibold text-brand-navy">Signing preferences (JSON)</span>
        <textarea
          value={prefsJson}
          onChange={(e) => setPrefsJson(e.target.value)}
          rows={6}
          className="mt-1 w-full rounded-brand-md border border-neutral-300 px-3 py-2 font-mono text-xs text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        />
      </label>
      {error ? (
        <p className="font-sans text-sm text-status-danger" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="font-sans text-sm text-brand-navy" role="status">
          {message}
        </p>
      ) : null}
      <Button type="submit" variant="gold" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}
