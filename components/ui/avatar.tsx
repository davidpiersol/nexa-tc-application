import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const avatarVariants = cva(
  "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-navy font-display font-semibold uppercase text-brand-gold-light",
  {
    variants: {
      size: {
        xs: "size-6 text-[10px]",
        sm: "size-8 text-xs",
        md: "size-10 text-sm",
        lg: "size-12 text-base",
        xl: "size-16 text-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  /** Optional image URL */
  src?: string | null;
  /** Alt text when `src` is set */
  alt?: string;
  /** Fallback initials (max ~2 chars recommended) */
  initials?: string;
}

/**
 * Circular avatar — navy surface, gold initials fallback per design system.
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, src, alt, initials, ...props }, ref) => {
    const label = initials?.slice(0, 2) ?? "?";
    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size }), className)}
        role={src ? undefined : "img"}
        aria-label={alt ?? label}
        {...props}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt ?? ""} className="size-full object-cover" />
        ) : (
          <span aria-hidden>{label}</span>
        )}
      </div>
    );
  },
);
Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
