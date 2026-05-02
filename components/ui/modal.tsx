"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ModalProps {
  /** Controlled open state */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Optional trigger — must be composed Radix trigger or button */
  trigger?: React.ReactNode;
  /** Modal heading */
  title: string;
  /** Optional description */
  description?: string;
  /** Body content */
  children: React.ReactNode;
  /** Footer actions row */
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Accessible overlay dialog — Radix Dialog + Nexa tokens (shadcn-compatible layering).
 */
function Modal({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  footer,
  className,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {trigger}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-brand-navy-deep/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-brand-lg border border-neutral-300 bg-white p-6 shadow-brand-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className,
          )}
        >
          <div className="flex flex-col gap-1.5">
            <DialogPrimitive.Title className="font-display text-heading-md text-brand-navy">
              {title}
            </DialogPrimitive.Title>
            {description ? (
              <DialogPrimitive.Description className="font-sans text-sm text-neutral-600">
                {description}
              </DialogPrimitive.Description>
            ) : (
              <DialogPrimitive.Description className="sr-only">
                {title}
              </DialogPrimitive.Description>
            )}
          </div>
          <div className="font-sans text-ui-body text-neutral-900">{children}</div>
          {footer ? (
            <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4">
              {footer}
            </div>
          ) : null}
          <DialogPrimitive.Close
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 focus:ring-offset-white"
            aria-label="Close"
          >
            <X className="size-4 text-brand-navy" />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export { Modal };
