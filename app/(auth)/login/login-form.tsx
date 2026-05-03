"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import NexaIcon from "@/components/brand/NexaIcon";
import NexaLogo from "@/components/brand/NexaLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { nexaBrand } from "@/lib/brand/tokens";
import { createClient } from "@/lib/supabase/client";

/**
 * Login — Supabase `signInWithPassword`; MFA enforced in middleware for privileged roles.
 */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/tc";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const supabase = createClient();
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setPending(false);
    if (signErr) {
      setError(signErr.message);
      return;
    }
    router.replace(redirect);
    router.refresh();
  }

  return (
    <div className="relative flex flex-col gap-8">
      <NexaIcon
        className="pointer-events-none absolute -right-1 -top-2 size-14 opacity-[0.14]"
        aria-hidden
      />
      <div className="flex flex-col gap-3">
        <NexaLogo showTagline={false} className="max-w-[240px]" title="NEXA" />
        <p className="font-sans text-sm font-semibold leading-snug text-brand-navy">
          {nexaBrand.tagline}
        </p>
        <p className="font-sans text-sm text-neutral-600">{nexaBrand.actionLine}</p>
      </div>
      <div>
        <h1 className="font-display text-heading-lg text-brand-navy">Sign in</h1>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Use your work email to access your scoped dashboard.
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
        <Button variant="gold" type="submit" className="w-full sm:w-auto" disabled={pending}>
          {pending ? "Signing in…" : "Continue"}
        </Button>
      </form>
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
