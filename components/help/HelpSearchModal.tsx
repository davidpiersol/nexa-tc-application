"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { HelpArticle } from "@/lib/help/types";
import { searchHelpArticles } from "@/lib/help/index";
import { cn } from "@/lib/utils/cn";

export function HelpSearchModal({
  open,
  onClose,
  onSelectArticle,
}: {
  open: boolean;
  onClose: () => void;
  onSelectArticle: (slug: string) => void;
}) {
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const hits = React.useMemo(() => searchHelpArticles(q).slice(0, 20), [q]);

  React.useEffect(() => {
    if (!open) {
      setQ("");
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-brand-navy-deep/70 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-search-heading"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[min(720px,90vh)] w-full max-w-2xl flex-col overflow-hidden rounded-brand-lg border border-neutral-300 bg-neutral-50 shadow-brand-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-brand-navy bg-brand-navy px-4 py-3">
          <Search className="size-5 shrink-0 text-brand-gold-light" aria-hidden />
          <h2
            id="help-search-heading"
            className="font-display text-lg font-semibold tracking-tight text-white"
          >
            Search help articles
          </h2>
          <Button
            type="button"
            variant="gold"
            size="sm"
            className="ml-auto min-w-0 px-2"
            onClick={onClose}
            aria-label="Close search"
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>
        <div className="border-b border-neutral-200 bg-white px-4 py-3">
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type to filter…"
            className="font-sans"
            aria-label="Search help"
          />
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {hits.map((a: HelpArticle) => (
            <li key={a.slug}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-brand-md px-3 py-3 text-left transition-colors",
                  "hover:bg-brand-gold-pale/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold",
                )}
                onClick={() => {
                  onSelectArticle(a.slug);
                  onClose();
                }}
              >
                <span className="block font-display text-base font-semibold text-brand-navy">
                  {a.title}
                </span>
                <span className="mt-0.5 block font-sans text-xs text-neutral-600">{a.route}</span>
              </button>
            </li>
          ))}
          {hits.length === 0 ? (
            <li className="px-3 py-8 text-center font-sans text-sm text-neutral-600">
              No matches.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
