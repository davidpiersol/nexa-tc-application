"use client";

import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/cn";

const markdownComponents: Components = {
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-8 font-display text-xl font-semibold text-brand-navy first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-6 font-display text-lg font-semibold text-brand-navy",
        className,
      )}
      {...props}
    />
  ),
  h4: ({ className, ...props }) => (
    <h4
      className={cn("mt-4 font-display text-base font-semibold text-brand-navy", className)}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("font-prose text-prose-body text-neutral-900", className)} {...props} />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-brand-navy", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-3 list-disc space-y-2 pl-6 font-prose text-prose-body text-neutral-900",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-3 list-decimal space-y-2 pl-6 font-prose text-prose-body text-neutral-900",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("marker:text-brand-gold", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-4 border-l-4 border-brand-gold bg-neutral-50 px-4 py-3 font-prose text-prose-body text-neutral-800 shadow-brand-sm",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn("font-medium text-brand-steel underline underline-offset-4", className)}
      {...props}
    />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-[0.9em] text-brand-navy",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-brand-md border border-neutral-300 bg-neutral-50 p-4 font-mono text-sm",
        className,
      )}
      {...props}
    />
  ),
  hr: () => <hr className="my-8 border-neutral-300" />,
  table: ({ className, ...props }) => (
    <div className="my-4 overflow-x-auto rounded-brand-md border border-neutral-300">
      <table className={cn("w-full border-collapse text-left font-prose text-sm", className)} {...props} />
    </div>
  ),
  thead: ({ ...props }) => <thead className="bg-neutral-100 font-semibold text-brand-navy" {...props} />,
  th: ({ className, ...props }) => (
    <th className={cn("border border-neutral-300 px-3 py-2", className)} {...props} />
  ),
  td: ({ className, ...props }) => (
    <td className={cn("border border-neutral-300 px-3 py-2 text-neutral-900", className)} {...props} />
  ),
  img: ({ src, alt }) => {
    if (!src) return null;
    const s = String(src);
    return (
      <span className="my-4 block overflow-hidden rounded-brand-md border border-neutral-300 bg-white p-2 shadow-brand-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- dynamic markdown paths */}
        <img
          src={s}
          alt={alt ?? ""}
          className="mx-auto max-h-[280px] w-auto max-w-full object-contain"
        />
      </span>
    );
  },
};

export function ArticleMarkdown({ content }: { content: string }) {
  return (
    <div className="help-article-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
