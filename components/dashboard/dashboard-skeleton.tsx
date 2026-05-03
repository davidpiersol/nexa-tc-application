import { cn } from "@/lib/utils/cn";

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded bg-neutral-200", className)}
      aria-hidden
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-brand-md border border-neutral-200 bg-white p-4 shadow-brand-sm"
          >
            <Bar className="mb-3 h-8 w-16" />
            <Bar className="h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="flex gap-4 overflow-hidden pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-[280px] w-[min(280px,72vw)] shrink-0 flex-col gap-3 rounded-brand-lg border border-neutral-200 bg-neutral-100 p-3"
          >
            <Bar className="h-5 w-24" />
            <Bar className="h-[72px] w-full" />
            <Bar className="h-[72px] w-full" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-3">
          <Bar className="h-6 w-40" />
          <Bar className="h-14 w-full" />
          <Bar className="h-14 w-full" />
        </div>
        <div className="lg:col-span-2 space-y-3">
          <Bar className="h-6 w-24" />
          <Bar className="h-12 w-full" />
          <Bar className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
