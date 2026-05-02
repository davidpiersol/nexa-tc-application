import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = { params: { token: string } };

/**
 * Figma: **Invite Acceptance/Default** → `/invite/[token]`
 * TODO: validate invite token + create session / profile.
 */
export default function InviteAcceptPage({ params }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-heading-lg text-brand-navy">Accept invitation</h1>
        <p className="mt-2 font-prose text-prose-body text-neutral-900">
          {/* TODO: fetch invite metadata (org, role, inviter) */}
          You’ve been invited to collaborate on Nexa. Review your access level and accept to
          continue.
        </p>
      </div>

      <dl className="rounded-brand-md border border-neutral-300 bg-neutral-50 p-4 font-sans text-sm">
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-neutral-600">Invite token</dt>
          <dd className="max-w-[12rem] truncate font-mono text-brand-navy">{params.token}</dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-neutral-600">Role</dt>
          <dd className="text-neutral-900">{/* TODO */}—</dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button variant="gold" type="button" asChild>
          <Link href="/signup">Accept & create account</Link>
        </Button>
        <Button variant="ghost" type="button" asChild>
          <Link href="/login">Decline</Link>
        </Button>
      </div>
    </div>
  );
}
