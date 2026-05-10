import type { ReactNode } from "react";
import Link from "next/link";
import { OAuthProviderButtons } from "@/components/auth/oauth-provider-buttons";
import { verifyInviteToken } from "@/lib/invite/jwt";
import { InviteAcceptForm } from "./invite-accept-form";

type Props = { params: { token: string } };

/**
 * Invite acceptance — JWT validated server-side; password POST + CSRF to `/api/invite/redeem`.
 */
export default async function InviteAcceptPage({ params }: Props) {
  const payload = await verifyInviteToken(params.token);

  if (!payload) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-heading-lg text-brand-navy">Invalid or expired invite</h1>
        <p className="font-prose text-prose-body text-neutral-900">
          Ask your administrator for a new invitation link.
        </p>
        <Link href="/login" className="text-brand-steel underline underline-offset-4">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-brand-navy">Accept invitation</h1>
        <p className="mt-2 font-prose text-prose-body text-neutral-900">
          You’ve been invited to Nexa. Use the same email shown below when signing in with a provider, or
          set a password.
        </p>
      </div>

      <dl className="rounded-brand-md border border-neutral-300 bg-neutral-50 p-4 font-sans text-sm">
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-neutral-600">Email</dt>
          <dd className="max-w-[14rem] truncate text-right text-brand-navy">{payload.email}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-neutral-600">Role</dt>
          <dd className="text-neutral-900">{payload.role}</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-2">
        <p className="font-sans text-sm text-neutral-600">
          Accept with Google, Microsoft, Apple, Facebook, or LinkedIn if enabled for this deployment (you
          must use the invited email).
        </p>
        <OAuthProviderButtons inviteToken={params.token} />
      </div>

      <InviteAcceptForm jwtToken={params.token} />

      <ButtonGhost href="/login">Decline</ButtonGhost>
    </div>
  );
}

function ButtonGhost({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-center font-sans text-sm font-semibold text-brand-steel underline underline-offset-4"
    >
      {children}
    </Link>
  );
}
