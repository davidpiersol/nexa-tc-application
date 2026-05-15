"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * App-wide error boundary. Lives at `app/error.tsx` (not under a route-group folder)
 * so the client chunk path avoids `(...)` segments — those URLs sometimes fail to load
 * (ChunkLoadError) after HMR or with certain dev caches.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="flex max-w-lg flex-col gap-4 rounded-brand-lg border border-status-danger/40 bg-white p-8 shadow-brand-md">
        <h2 className="font-display text-heading-md text-brand-navy">Something went wrong</h2>
        <p className="font-sans text-ui-body text-neutral-700">{error.message}</p>
        <Button type="button" variant="gold" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}
