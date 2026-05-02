"use client";

import * as React from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils/cn";

export interface ThreadMessage {
  id: string;
  /** Display name */
  author: string;
  body: string;
  /** Align bubble — TC/internal vs party */
  variant?: "internal" | "party";
}

export interface MessageThreadProps {
  messages: ThreadMessage[];
  className?: string;
}

/**
 * Scrollable conversation — neutral shells; internal vs party tint using brand neutrals.
 */
function MessageThread({ className, messages }: MessageThreadProps) {
  return (
    <ScrollArea.Root
      className={cn(
        "flex max-h-[480px] flex-col rounded-brand-lg border border-neutral-300 bg-neutral-50",
        className,
      )}
    >
      <ScrollArea.Viewport className="max-h-[480px] p-4">
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-brand-md border px-3 py-2 font-sans text-ui-body shadow-brand-sm",
                m.variant === "internal"
                  ? "ml-auto border-brand-navy-mid bg-white text-brand-navy"
                  : "mr-auto border-neutral-300 bg-white text-neutral-900",
              )}
            >
              <p className="text-ui-label text-neutral-600">{m.author}</p>
              <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
            </li>
          ))}
        </ul>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        className="flex touch-none select-none bg-neutral-100 p-0.5 transition-colors hover:bg-neutral-200"
        orientation="vertical"
      >
        <ScrollArea.Thumb className="relative flex-1 rounded-full bg-brand-gold" />
      </ScrollArea.Scrollbar>
    </ScrollArea.Root>
  );
}

export { MessageThread };
