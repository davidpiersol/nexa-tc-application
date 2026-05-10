"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  OAUTH_PROVIDER_LABELS,
  parseEnabledOAuthProvidersFromEnv,
  toSupabaseProvider,
  type OAuthUiKey,
} from "@/lib/auth/oauth-providers";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type Props = {
  /** When set, OAuth uses `/api/auth/oauth/start` so an HttpOnly invite cookie is stored before the IdP redirect. */
  inviteToken?: string;
};

export function OAuthProviderButtons({ inviteToken }: Props) {
  const enabled = parseEnabledOAuthProvidersFromEnv(process.env.NEXT_PUBLIC_OAUTH_PROVIDERS);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  if (enabled.length === 0) return null;

  async function startOAuth(ui: OAuthUiKey) {
    setError(null);
    setBusyKey(ui);
    try {
      if (inviteToken) {
        const csrfRes = await fetch("/api/csrf", { credentials: "include" });
        const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
        const csrfToken = csrfJson.csrfToken;
        if (!csrfToken) {
          setError("Security token missing. Refresh and try again.");
          setBusyKey(null);
          return;
        }

        const res = await fetch("/api/auth/oauth/start", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            [CSRF_HEADER_NAME]: csrfToken,
          },
          body: JSON.stringify({ provider: ui, inviteToken }),
        });

        const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !body.url) {
          setError(body.error ?? "Could not start OAuth.");
          setBusyKey(null);
          return;
        }

        window.location.assign(body.url);
        return;
      }

      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: oauthErr } = await supabase.auth.signInWithOAuth({
        provider: toSupabaseProvider(ui),
        options: { redirectTo },
      });

      if (oauthErr) {
        setError(oauthErr.message);
      }
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-center font-sans text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Or continue with
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {enabled.map((key) => (
          <Button
            key={key}
            type="button"
            variant="secondary"
            size="md"
            className="w-full sm:w-auto"
            disabled={busyKey !== null}
            onClick={() => void startOAuth(key)}
          >
            {busyKey === key ? "Redirecting…" : OAUTH_PROVIDER_LABELS[key]}
          </Button>
        ))}
      </div>
      {error ? (
        <p className="text-center font-sans text-sm text-status-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
