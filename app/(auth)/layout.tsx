export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="choral-app-background flex min-h-screen items-center justify-center px-4 py-8 text-neutral-900">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-brand-navy/10 bg-white/80 shadow-brand-lg backdrop-blur md:grid-cols-[1fr_0.86fr]">
        <section className="choral-wave-surface hidden min-h-[38rem] md:block">
          <div className="relative z-10 max-w-sm p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-brand-gold-deep">
              Choral Point
            </p>
            <h2 className="mt-5 text-[42px] font-semibold leading-[1.02] text-brand-navy">
              The operational core of every real estate deal.
            </h2>
            <p className="mt-5 leading-7 text-brand-steel">
              Coordinate participants, documents, and milestones from one calm workspace.
            </p>
          </div>
        </section>
        <div className="p-7 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
