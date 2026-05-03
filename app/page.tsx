import Link from "next/link";
import NexaIcon from "@/components/brand/NexaIcon";
import NexaLogo from "@/components/brand/NexaLogo";
import { nexaBrand } from "@/lib/brand/tokens";

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8 p-10">
      <div className="flex flex-col gap-4">
        <NexaLogo showTagline={false} className="max-w-[280px]" title="NEXA" />
        <h1 className="font-display text-heading-md text-brand-navy">
          {nexaBrand.tagline}
        </h1>
        <p className="text-ui-body text-neutral-600">{nexaBrand.actionLine}</p>
      </div>
      <div className="flex items-start gap-4 border-t border-neutral-200 pt-6">
        <NexaIcon className="mt-0.5 size-10 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-ui-body text-neutral-600">
            Scaffold routes — use dashboard sections below during development.
          </p>
          <ul className="flex flex-col gap-2 text-ui-body">
            <li>
              <Link className="text-brand-steel underline" href="/login">
                Login
              </Link>
            </li>
            <li>
              <Link className="text-brand-steel underline" href="/tc">
                TC dashboard
              </Link>
            </li>
            <li>
              <Link className="text-brand-steel underline" href="/buyer/example-id">
                Buyer dashboard (sample id)
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
