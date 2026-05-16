import Link from "next/link";
import { ChoralPointLogo } from "@/components/brand/ChoralPointLogo";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="choral-auth-page min-h-screen text-brand-navy">
      <div className="choral-auth-shell">
        <header className="flex items-center justify-between gap-4 py-7">
          <ChoralPointLogo className="text-[15px] tracking-[0.34em]" />
          <Link href="/" className="choral-auth-back-link">
            Back to site
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 md:grid-cols-[minmax(360px,1fr)_minmax(420px,0.92fr)] md:gap-14">
          <div className="max-w-xl">
            <h1 className="font-display text-[42px] font-semibold leading-[1.02] tracking-[-0.045em] text-brand-navy sm:text-[62px]">
              Welcome back.
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-brand-navy/75 sm:text-[19px]">
              Return to the shared center of every transaction — where participants, documents, and milestones stay aligned.
            </p>
          </div>

          <div className="choral-auth-card justify-self-end">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
