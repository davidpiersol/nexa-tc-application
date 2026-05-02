"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type Props = {
  jwtToken: string;
};

export function InviteAcceptForm({ jwtToken }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");

    const csrfRes = await fetch("/api/csrf", { credentials: "include" });
    const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
    const csrfToken = csrfJson.csrfToken;
    if (!csrfToken) {
      setError("Could not load session security token.");
      setBusy(false);
      return;
    }

    const res = await fetch("/api/invite/redeem", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: csrfToken,
      },
      body: JSON.stringify({ token: jwtToken, password }),
    });

    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);

    if (!res.ok) {
      setError(body.error ?? "Could not complete signup.");
      return;
    }

    router.replace("/login?redirect=/tc");
    router.refresh();
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <Input
        label="Choose password"
        type="password"
        name="password"
        autoComplete="new-password"
        required
        minLength={8}
      />
      {error ? (
        <p className="font-sans text-sm text-status-danger" role="alert">
          {error}
        </p>
      ) : null}
      <Button variant="gold" type="submit" disabled={busy}>
        {busy ? "Creating account…" : "Accept & create account"}
      </Button>
    </form>
  );
}
