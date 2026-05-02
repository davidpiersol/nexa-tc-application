import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Figma: **Login/Default** → `/login`
 * TODO: Supabase Auth signInWithPassword + error states.
 */
export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-brand-navy">Sign in</h1>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          {/* TODO: SSO providers */}
          Use your work email to access your scoped dashboard.
        </p>
      </div>
      <form className="flex flex-col gap-5" action="#" method="post">
        {/* TODO: Server Action or client submit */}
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
        <Button variant="gold" type="submit" className="w-full sm:w-auto">
          Continue
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
