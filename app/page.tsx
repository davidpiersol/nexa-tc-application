import Link from "next/link";
import { ChoralPointLogo } from "@/components/brand/ChoralPointLogo";
import { choralPointBrand } from "@/lib/brand/tokens";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-6 text-brand-navy sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="flex items-center justify-between gap-4 py-2">
          <ChoralPointLogo />
          <nav className="hidden items-center gap-7 text-sm text-brand-steel md:flex">
            <Link href="/login">Sign in</Link>
            <Link href="/signup">Create account</Link>
            <Link
              href="/login"
              className="rounded-xl bg-brand-gold px-5 py-3 font-semibold text-white shadow-brand-md transition hover:bg-brand-gold-deep"
            >
              Open workspace
            </Link>
          </nav>
        </header>

        <section className="choral-wave-surface min-h-[31rem] rounded-[28px] shadow-brand-lg">
          <div className="relative z-10 max-w-xl px-7 py-12 sm:px-12 sm:py-20">
            <h1 className="font-display text-[42px] font-semibold leading-[0.98] text-brand-navy sm:text-[54px]">
              {choralPointBrand.tagline}
            </h1>
            <p className="mt-5 max-w-md text-lg leading-8 text-brand-steel">
              {choralPointBrand.actionLine}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="rounded-xl bg-brand-gold px-5 py-3 font-semibold text-white shadow-brand-md transition hover:bg-brand-gold-deep"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl border border-brand-navy/15 bg-white/80 px-5 py-3 font-semibold text-brand-navy backdrop-blur transition hover:bg-white"
              >
                Create account
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-6 md:grid-cols-3">
          {[
            ["Transactions", "Coordinate documents, parties, milestones, and approvals in one workspace."],
            ["CRM", "Keep the next touch, follow-up, and relationship context close to the work."],
            ["Reporting", "See billing, tax, and operational activity without leaving the platform."],
          ].map(([title, body]) => (
            <article key={title} className="choral-panel rounded-[22px] p-6">
              <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-brand-steel">{body}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
