import Link from "next/link";
import { ChoralPointLogo } from "@/components/brand/ChoralPointLogo";

type MarketingPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ title: string; body: string }>;
};

export function MarketingPage({ eyebrow, title, intro, sections }: MarketingPageProps) {
  return (
    <main className="choral-marketing-page min-h-screen text-brand-navy">
      <div className="choral-marketing-shell">
        <header className="flex items-center justify-between gap-4 py-7">
          <Link href="/"><ChoralPointLogo className="text-[15px] tracking-[0.34em]" /></Link>
          <nav className="hidden items-center gap-9 text-sm text-brand-navy/80 md:flex">
            <Link href="/platform">Platform</Link>
            <Link href="/solutions">Solutions</Link>
            <Link href="/resources">Resources</Link>
            <Link href="/company">Company</Link>
            <Link href="/login">Login</Link>
          </nav>
          <Link href="/request-demo" className="choral-marketing-primary">Request a Demo</Link>
        </header>
        <section className="flex flex-1 items-center py-10">
          <div className="w-full">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-brand-gold-deep">{eyebrow}</p>
            <h1 className="mt-5 max-w-4xl font-display text-[40px] font-semibold leading-[1.04] tracking-[-0.045em] sm:text-[58px]">{title}</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-brand-navy/75">{intro}</p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {sections.map((section) => (
                <article key={section.title} className="choral-marketing-card">
                  <h2 className="text-lg font-semibold">{section.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-brand-navy/75">{section.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
