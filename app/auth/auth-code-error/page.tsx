import Link from "next/link";

function firstParam(raw: string | string[] | undefined): string | undefined {
  if (Array.isArray(raw)) return raw[0];
  return raw;
}

export default function AuthCodeErrorPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const reason = firstParam(searchParams.reason);
  const detail = firstParam(searchParams.detail);
  const message = firstParam(searchParams.message);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-heading-lg text-brand-navy">Sign-in interrupted</h1>
      <p className="font-sans text-ui-body text-neutral-700">
        Something went wrong while connecting your account. You can try again from the sign-in page.
      </p>
      {reason ? (
        <p className="rounded-md bg-neutral-100 px-3 py-2 font-mono text-xs text-neutral-700">
          {reason}
          {message ? `: ${message}` : ""}
        </p>
      ) : null}
      {detail ? (
        <p className="font-sans text-sm text-neutral-600">
          {detail}
        </p>
      ) : null}
      <Link href="/login" className="font-sans text-sm font-semibold text-brand-steel underline underline-offset-4">
        Back to sign in
      </Link>
    </div>
  );
}
