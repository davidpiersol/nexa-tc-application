"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * MFA enrollment / verification — Supabase Auth TOTP (`mfa.enroll`, `challengeAndVerify`).
 */
export default function MfaSetupPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    setSupabase(createClient());
  }, []);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let cancelled = false;
    async function run() {
      setError(null);
      setBusy(true);
      const { data: factorData } = await client.auth.mfa.listFactors();
      const already =
        factorData?.all?.some(
          (f) => f.factor_type === "totp" && f.status === "verified",
        ) ?? false;
      if (already) {
        router.replace("/tc");
        return;
      }
      const { data, error: enrollErr } = await client.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Authenticator app",
      });
      if (cancelled) return;
      setBusy(false);
      if (enrollErr || !data) {
        setError(enrollErr?.message ?? "Could not start MFA enrollment.");
        return;
      }
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [router, supabase]);

  async function onVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!supabase || !factorId) return;
    const form = new FormData(e.currentTarget);
    const code = String(form.get("otp") ?? "").replace(/\s/g, "");
    setError(null);
    setBusy(true);
    const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    setBusy(false);
    if (verifyErr) {
      setError(verifyErr.message);
      return;
    }
    router.replace("/tc");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-brand-navy">Set up MFA</h1>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Scan the code with your authenticator app, then enter a one-time code to confirm.
        </p>
      </div>

      {qrCode ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL / otpauth from Supabase
        <img
          src={qrCode}
          alt="Scan with authenticator app"
          className="mx-auto max-h-[200px] w-full max-w-[200px] rounded-brand-md border border-neutral-300 bg-white object-contain p-2"
        />
      ) : (
        <div
          className="flex aspect-square w-full max-w-[200px] items-center justify-center rounded-brand-md border-2 border-dashed border-neutral-300 bg-neutral-50 font-sans text-sm text-neutral-600"
          aria-hidden
        >
          {busy ? "Loading…" : "QR unavailable"}
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={onVerify}>
        <Input
          label="One-time code"
          inputMode="numeric"
          name="otp"
          autoComplete="one-time-code"
          placeholder="000000"
          required
        />
        {error ? (
          <p className="font-sans text-sm text-status-danger" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="gold" type="submit" disabled={busy || !factorId}>
            Verify & enable
          </Button>
          <Button variant="secondary" type="button" asChild>
            <Link href="/login">Back to sign in</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
