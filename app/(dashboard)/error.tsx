"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
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
    <div className="flex flex-col gap-4 rounded-brand-lg border border-status-danger/40 bg-white p-8 shadow-brand-md">
      <h2 className="font-display text-heading-md text-brand-navy">Something went wrong</h2>
      <p className="font-sans text-ui-body text-neutral-700">{error.message}</p>
      <Button type="button" variant="gold" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
