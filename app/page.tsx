import Link from "next/link";
import { ChoralPointLogo } from "@/components/brand/ChoralPointLogo";
import { choralPointBrand } from "@/lib/brand/tokens";

export default function HomePage() {
  return (
    <main className="choral-marketing-page min-h-screen text-brand-navy">
      <div className="choral-marketing-shell">
        <header className="flex items-center justify-between gap-4 py-7">
          <ChoralPointLogo className="text-[15px] tracking-[0.34em]" />
          <nav className="hidden items-center gap-9 text-sm text-brand-navy/80 md:flex">
            <Link href="/platform">Platform</Link>
            <Link href="/solutions">Solutions</Link>
            <Link href="/resources">Resources</Link>
            <Link href="/company">Company</Link>
            <Link href="/login">Login</Link>
          </nav>
          <Link href="/request-demo" className="choral-marketing-primary">
            Request a Demo
          </Link>
        </header>

        <section className="flex flex-1 items-center">
          <div className="max-w-2xl pb-10">
            <h1 className="font-display text-[46px] font-semibold leading-[1.03] tracking-[-0.045em] text-brand-navy sm:text-[72px]">
              {choralPointBrand.tagline.split(" ").slice(0, 2).join(" ")}<br />
              {choralPointBrand.tagline.split(" ").slice(2).join(" ")}
            </h1>
            <p className="mt-7 text-lg leading-8 text-brand-navy/75 sm:text-xl">
              One platform. Every participant.<br />
              Perfectly in sync.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link href="/request-demo" className="choral-marketing-primary">
                Request a Demo
              </Link>
              <Link href="/how-it-works" className="choral-marketing-secondary">
                See How It Works
                <span className="choral-play-dot" aria-hidden>
                  ▶
                </span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
