import Link from "next/link";
import NexaIcon from "@/components/brand/NexaIcon";
import NexaLogo from "@/components/brand/NexaLogo";
import { OAuthProviderButtons } from "@/components/auth/oauth-provider-buttons";
import { nexaBrand } from "@/lib/brand/tokens";

export default function SignupPage() {
  return (
    <div className="relative flex flex-col gap-8">
      <NexaIcon
        className="pointer-events-none absolute -right-1 -top-2 size-14 opacity-[0.14]"
        aria-hidden
      />
      <div className="flex flex-col gap-3">
        <NexaLogo showTagline={false} className="max-w-[240px]" title="NEXA" />
        <p className="font-sans text-sm font-semibold leading-snug text-brand-navy">{nexaBrand.tagline}</p>
      </div>
      <div>
        <h1 className="font-display text-heading-lg text-brand-navy">Create account</h1>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          Brokerage access requires an invitation from your team. Use the email link you received first,
          or continue with a supported identity provider if your coordinator enabled OAuth.
        </p>
      </div>
      <OAuthProviderButtons />
      <p className="font-sans text-sm text-neutral-600">
        Email-and-password self-registration without an invite is not enabled for coordinator or broker
        roles. Yahoo Mail is not offered as a one-click provider here; plan on custom OAuth/OIDC or an
        identity broker (see the{" "}
        <span className="break-all font-mono text-xs">
          docs/choral-point-roadmap/auth-oauth-account-strategy.md
        </span>{" "}
        note in the repository).
      </p>
      <p className="text-center font-sans text-sm text-neutral-600">
        <Link href="/login" className="text-brand-steel underline underline-offset-4">
          Already have an account? Sign in
        </Link>
      </p>
    </div>
  );
}
