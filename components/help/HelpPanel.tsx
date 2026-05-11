"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CircleHelp, Search, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArticleMarkdown } from "@/components/help/ArticleMarkdown";
import { HelpSearchModal } from "@/components/help/HelpSearchModal";
import {
  getArticleBySlug,
  resolveHelpSlugForPath,
  searchHelpArticles,
} from "@/lib/help/index";
import type { HelpArticle } from "@/lib/help/types";
import { cn } from "@/lib/utils/cn";

export function HelpPanel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [pickedSlug, setPickedSlug] = React.useState<string | null>(null);
  const [panelQuery, setPanelQuery] = React.useState("");

  const contextSlug = resolveHelpSlugForPath(pathname ?? "/");
  const activeSlug = pickedSlug ?? contextSlug;
  const activeArticle = getArticleBySlug(activeSlug);

  React.useEffect(() => {
    setPickedSlug(null);
  }, [pathname]);

  React.useEffect(() => {
    const linkedSlug = searchParams.get("help");
    if (!linkedSlug || !getArticleBySlug(linkedSlug)) return;
    setPickedSlug(linkedSlug);
    setPanelQuery("");
    setOpen(true);
  }, [searchParams]);

  React.useEffect(() => {
    if (!open && !commandOpen) return;
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, commandOpen]);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        const t = e.target as HTMLElement | null;
        if (t?.closest?.('[contenteditable="true"]')) return;
        e.preventDefault();
        setCommandOpen(true);
      }
      if (e.key === "Escape" && open && !commandOpen) {
        e.preventDefault();
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, commandOpen]);

  const searching = panelQuery.trim().length > 0;

  const panelHits = React.useMemo(() => {
    const q = panelQuery.trim();
    if (!q) return [];
    return searchHelpArticles(q).slice(0, 8);
  }, [panelQuery]);

  function handleSelectFromModal(slug: string) {
    setPickedSlug(slug);
    setPanelQuery("");
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "fixed bottom-6 right-6 z-[110] flex h-14 w-14 items-center justify-center rounded-full",
          "border-2 border-brand-gold bg-brand-navy text-brand-gold-light shadow-brand-lg",
          "transition hover:bg-brand-navy-mid hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold focus-visible:ring-offset-2",
        )}
        aria-label="Open Help & Guide"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen((wasOpen) => {
            const nextOpen = !wasOpen;
            if (nextOpen) {
              setPickedSlug(null);
              setPanelQuery("");
            }
            return nextOpen;
          });
        }}
      >
        <CircleHelp className="size-7" aria-hidden />
      </button>

      <HelpSearchModal
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        onSelectArticle={handleSelectFromModal}
      />

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close help overlay"
              className="fixed inset-0 z-[120] bg-brand-navy-deep/45 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-labelledby="help-panel-title"
              className={cn(
                "fixed bottom-0 right-0 top-0 z-[130] flex w-[min(420px,100vw)] flex-col",
                "border-l border-brand-navy bg-neutral-50 shadow-brand-lg",
              )}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="flex shrink-0 items-center gap-2 border-b border-brand-navy bg-brand-navy px-4 py-3">
                <h2
                  id="help-panel-title"
                  className="font-display text-xl font-semibold tracking-tight text-white"
                >
                  Help & Guide
                </h2>
                <Button
                  type="button"
                  variant="gold"
                  size="sm"
                  className="ml-auto min-w-0 px-2"
                  onClick={() => setOpen(false)}
                  aria-label="Close help panel"
                >
                  <X className="size-5 text-brand-navy" aria-hidden />
                </Button>
              </div>

              <div className="border-b border-neutral-200 bg-white px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-sans text-xs text-neutral-600">
                    Page help · {getArticleBySlug(contextSlug)?.title ?? "Workspace guide"}
                  </p>
                  {pickedSlug ? (
                    <button
                      type="button"
                      className="shrink-0 font-sans text-xs text-brand-steel underline underline-offset-4"
                      onClick={() => {
                        setPickedSlug(null);
                        setPanelQuery("");
                      }}
                    >
                      Back to this page
                    </button>
                  ) : null}
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-600" />
                  <Input
                    value={panelQuery}
                    onChange={(e) => setPanelQuery(e.target.value)}
                    placeholder="Search articles…"
                    className="pl-10 font-sans"
                    aria-label="Search help articles"
                  />
                </div>
                <button
                  type="button"
                  className="mt-2 font-sans text-xs text-brand-steel underline underline-offset-4"
                  onClick={() => setCommandOpen(true)}
                >
                  Open full-screen search (⌘K)
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                {searching ? (
                  panelHits.length > 0 ? (
                    <ul className="space-y-1">
                      {panelHits.map((a: HelpArticle) => (
                        <li key={a.slug}>
                          <button
                            type="button"
                            className="w-full rounded-brand-md border border-neutral-200 bg-white px-3 py-2 text-left shadow-brand-sm hover:border-brand-gold"
                            onClick={() => {
                              setPickedSlug(a.slug);
                              setPanelQuery("");
                            }}
                          >
                            <span className="font-display text-sm font-semibold text-brand-navy">
                              {a.title}
                            </span>
                            <span className="mt-0.5 block font-sans text-xs text-neutral-600">
                              {a.route}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="font-sans text-sm text-neutral-600">No matches.</p>
                  )
                ) : activeArticle ? (
                  <div>
                    <p className="mb-3 font-sans text-xs uppercase tracking-wide text-neutral-600">
                      {activeArticle.route}
                    </p>
                    <ArticleMarkdown content={activeArticle.content} />
                  </div>
                ) : (
                  <p className="font-sans text-sm text-neutral-600">Article not found.</p>
                )}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
