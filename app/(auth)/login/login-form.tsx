"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OAuthProviderButtons } from "@/components/auth/oauth-provider-buttons";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

export type LoginFormProps = {
  /** Post-login path from `?redirect=` (validated on submit). */
  redirect?: string;
};

/**
 * Login — `POST /api/auth/login` (rate-limited per IP) sets session cookies; MFA enforced in middleware.
 */
export function LoginForm({ redirect: redirectProp = "/tc" }: LoginFormProps) {
  const router = useRouter();
  const redirect = redirectProp;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const csrfRes = await fetch("/api/csrf", { credentials: "include" });
    const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
    const csrfToken = csrfJson.csrfToken;
    if (!csrfToken) {
      setPending(false);
      setError("Security token missing. Refresh and try again.");
      return;
    }

    const loginRes = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: csrfToken,
      },
      body: JSON.stringify({ email, password }),
    });

    setPending(false);

    if (loginRes.status === 429) {
      setError("Too many sign-in attempts from this network. Try again later.");
      return;
    }

    if (!loginRes.ok) {
      const body = (await loginRes.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Sign in failed.");
      return;
    }

    const allowExternal =
      redirect &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//") &&
      redirect !== "/tc" &&
      redirect !== "/";
    if (allowExternal) {
      router.replace(redirect);
      router.refresh();
      return;
    }
    window.location.assign(new URL("/api/auth/role-redirect", window.location.origin).toString());
  }

  return (
    <div className="relative flex flex-col gap-6">
      <div>
        <h2 className="font-display text-[28px] font-semibold tracking-[-0.03em] text-brand-navy">
          Sign in
        </h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Access your Choral Point workspace
        </p>
      </div>
      <form className="flex flex-col gap-5" onSubmit={onSubmit}>
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          required
        />
        {error ? (
          <p className="font-sans text-sm text-status-danger" role="alert">
            {error}
          </p>
        ) : null}
        <Button variant="gold" type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Continue"}
        </Button>
      </form>
      <OAuthProviderButtons />
      <p className="text-center font-sans text-sm text-neutral-600">
        <Link href="/auth/mfa" className="text-brand-steel underline underline-offset-4">
          MFA setup
        </Link>
        <span className="mx-2 text-neutral-300">·</span>
        <Link href="/signup" className="text-brand-steel underline underline-offset-4">
          Create account
        </Link>
      </p>
    </div>
  );
}
