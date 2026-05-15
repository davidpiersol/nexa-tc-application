import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type ChoralPointLogoProps = {
  className?: string;
  compact?: boolean;
};

export function ChoralPointLogo({
  className,
  compact = false,
}: ChoralPointLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center uppercase text-brand-navy",
        compact ? "gap-2 text-sm font-semibold tracking-[0.24em]" : "gap-3 text-base font-semibold tracking-[0.36em]",
        className,
      )}
      aria-label="Choral Point"
    >
      <span>Choral</span>
      <Image
        src="/brand/choral-point/starburst.svg"
        alt=""
        width={compact ? 28 : 36}
        height={compact ? 28 : 36}
        aria-hidden
      />
      <span className="text-brand-gold-deep">Point</span>
    </span>
  );
}
