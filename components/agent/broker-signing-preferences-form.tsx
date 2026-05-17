"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import {
  SIGNING_DELIVERY_MODE,
  SIGNING_PROVIDERS,
  getSigningProvider,
  normalizeSigningDeliveryMode,
  resolveSigningWorkflowSlug,
  type SigningDeliveryMode,
} from "@/lib/signing/signing-workflow";

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
  const initialPrefs = React.useMemo(() => {
    try {
      return JSON.parse(initialSigningPreferencesJson || "{}") as { mode?: string };
    } catch {
      return {};
    }
  }, [initialSigningPreferencesJson]);
  const initialProvider = resolveSigningWorkflowSlug(initialSigningPlatform).slug;
  const [platform, setPlatform] = React.useState(initialProvider);
  const [mode, setMode] = React.useState<SigningDeliveryMode>(
    normalizeSigningDeliveryMode(initialPrefs.mode),
  );
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const selectedProvider = getSigningProvider(platform);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

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
        signing_platform: platform,
        signing_preferences: {
          providerSlug: platform,
          mode,
        },
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
        Choose where Choral Point should send documents for signature. Secrets are handled by the
        tenant admin setup; this form only chooses the default workflow.
      </p>
      <label className="block font-sans text-sm">
        <span className="font-semibold text-brand-navy">E-sign provider</span>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value as typeof platform)}
          className="mt-1 w-full rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-sm text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          {SIGNING_PROVIDERS.map((provider) => (
            <option key={provider.slug} value={provider.slug}>
              {provider.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block font-sans text-sm">
        <span className="font-semibold text-brand-navy">How should recipients sign?</span>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as SigningDeliveryMode)}
          className="mt-1 w-full rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-sm text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
        >
          <option value={SIGNING_DELIVERY_MODE.emailLink}>Email signing link</option>
          <option value={SIGNING_DELIVERY_MODE.embedded}>Embedded signing later</option>
          <option value={SIGNING_DELIVERY_MODE.providerPortal}>Provider portal handoff</option>
          <option value={SIGNING_DELIVERY_MODE.manualExport}>Manual export packet</option>
        </select>
      </label>
      <div className="rounded-brand-md border border-neutral-200 bg-neutral-50 p-3 font-sans text-sm text-neutral-700">
        <p className="font-semibold text-brand-navy">{selectedProvider.shortLabel}</p>
        <p className="mt-1">{selectedProvider.apiSummary}</p>
        <p className="mt-1">{selectedProvider.setupHelp}</p>
      </div>
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
