import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Figma: **MFA Setup/Default** → `/auth/mfa`
 * TODO: Supabase MFA enrollment (TOTP) + verify challenge.
 */
export default function MfaSetupPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-brand-navy">Set up MFA</h1>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          {/* TODO: show QR from enroll API */}
          Scan the code with your authenticator app, then enter a one-time code to confirm.
        </p>
      </div>

      <div
        className="flex aspect-square w-full max-w-[200px] items-center justify-center rounded-brand-md border-2 border-dashed border-neutral-300 bg-neutral-50 font-sans text-sm text-neutral-600"
        aria-hidden
      >
        QR placeholder
      </div>

      <Input
        label="One-time code"
        inputMode="numeric"
        name="otp"
        autoComplete="one-time-code"
        placeholder="000000"
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="gold" type="button">
          Verify & enable
        </Button>
        <Button variant="secondary" type="button" asChild>
          <Link href="/login">Back to sign in</Link>
        </Button>
      </div>
    </div>
  );
}
