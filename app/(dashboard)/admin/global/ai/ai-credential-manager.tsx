"use client";

import { useMemo, useState } from "react";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type ProviderOption = {
  key: string;
  label: string;
  credentialProvider: string;
  authMode: string;
};

type CredentialStatus = {
  provider: string;
  configured: boolean;
  settings: Record<string, unknown>;
  updatedAt: string | null;
};

type AiCredentialManagerProps = {
  providers: ProviderOption[];
  initialStatuses: CredentialStatus[];
};

async function loadCsrfToken(): Promise<string> {
  const response = await fetch("/api/csrf", { credentials: "include" });
  const body = (await response.json()) as { csrfToken?: string };
  if (!body.csrfToken) throw new Error("Missing CSRF token");
  return body.csrfToken;
}

export function AiCredentialManager({
  providers,
  initialStatuses,
}: AiCredentialManagerProps) {
  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.credentialProvider ?? "");
  const [apiKey, setApiKey] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [notes, setNotes] = useState("");
  const [statuses, setStatuses] = useState(initialStatuses);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const statusByProvider = useMemo(() => {
    return new Map(statuses.map((status) => [status.provider, status]));
  }, [statuses]);
  const selectedStatus = statusByProvider.get(selectedProvider);

  async function refreshStatuses() {
    const response = await fetch("/api/admin/global/ai/credentials", {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Unable to refresh credential status");
    const body = (await response.json()) as { items?: CredentialStatus[] };
    setStatuses(body.items ?? []);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);
    try {
      const csrfToken = await loadCsrfToken();
      const response = await fetch("/api/admin/global/ai/credentials", {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: csrfToken,
        },
        body: JSON.stringify({
          credentialProvider: selectedProvider,
          apiKey,
          defaultModel: defaultModel.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Unable to save credential");
      }
      setApiKey("");
      setMessage("Credential saved. Secret value is encrypted and hidden after save.");
      await refreshStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save credential");
    } finally {
      setSaving(false);
    }
  }

  async function handleTestKey() {
    setError(null);
    setMessage(null);
    setTesting(true);
    try {
      const csrfToken = await loadCsrfToken();
      const response = await fetch("/api/admin/global/ai/credentials/test", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          [CSRF_HEADER_NAME]: csrfToken,
        },
        body: JSON.stringify({ credentialProvider: selectedProvider }),
      });
      const body = (await response.json().catch(() => ({}))) as {
        result?: { message?: string };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.result?.message ?? body.error ?? "Credential test failed");
      }
      setMessage(body.result?.message ?? "Credential test passed.");
      await refreshStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Credential test failed");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-display text-heading-md text-brand-navy">AI Credentials</h3>
          <p className="mt-2 max-w-3xl font-sans text-sm text-neutral-600">
            Save or replace a provider key. Saved keys are encrypted server-side and never displayed
            back in the browser.
          </p>
        </div>
      </div>

      <form className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-2 font-sans text-sm font-semibold text-brand-navy">
          Provider
          <select
            className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2 font-sans text-sm text-neutral-900"
            value={selectedProvider}
            onChange={(event) => setSelectedProvider(event.target.value)}
            required
          >
            {providers.map((provider) => (
              <option key={provider.credentialProvider} value={provider.credentialProvider}>
                {provider.label}
              </option>
            ))}
          </select>
          <span className="font-sans text-xs font-normal text-neutral-600">
            {selectedStatus?.configured
              ? `Configured${
                  selectedStatus.updatedAt
                    ? ` · updated ${new Date(selectedStatus.updatedAt).toLocaleString()}`
                    : ""
                }`
              : "Not configured"}
          </span>
        </label>

        <label className="flex flex-col gap-2 font-sans text-sm font-semibold text-brand-navy">
          API key
          <input
            className="rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-sm text-neutral-900"
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            autoComplete="off"
            placeholder="Paste the provider key"
            required
          />
        </label>

        <label className="flex flex-col gap-2 font-sans text-sm font-semibold text-brand-navy">
          Default model override
          <input
            className="rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-sm text-neutral-900"
            value={defaultModel}
            onChange={(event) => setDefaultModel(event.target.value)}
            placeholder="Optional"
          />
        </label>

        <label className="flex flex-col gap-2 font-sans text-sm font-semibold text-brand-navy">
          Admin notes
          <input
            className="rounded-brand-md border border-neutral-300 px-3 py-2 font-sans text-sm text-neutral-900"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional setup note"
          />
        </label>

        <div className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-brand-md bg-brand-navy px-4 py-2 font-sans text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={saving || !selectedProvider || apiKey.length < 8}
            >
              {saving ? "Saving..." : "Save encrypted credential"}
            </button>
            <button
              className="rounded-brand-md border border-brand-navy px-4 py-2 font-sans text-sm font-semibold text-brand-navy disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={testing || saving || !selectedProvider || !selectedStatus?.configured}
              onClick={handleTestKey}
            >
              {testing ? "Testing..." : "Test saved key"}
            </button>
          </div>
          {message ? <p className="mt-3 font-sans text-sm text-green-700">{message}</p> : null}
          {error ? <p className="mt-3 font-sans text-sm text-red-700">{error}</p> : null}
        </div>
      </form>
    </section>
  );
}
