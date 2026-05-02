import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const stroke = "stroke-brand-navy";
const accent = "stroke-brand-gold";

function BaseIcon({ size = 24, className, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(stroke, className)}
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Contract — folded page + signature line */
function ContractIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 3h7l5 5v13a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" strokeWidth="1.5" />
      <path d="M14 3v5h5" strokeWidth="1.5" />
      <path d="M8 17h8" className={accent} strokeWidth="1.5" />
    </BaseIcon>
  );
}

/** Disclosure — stacked lines */
function DisclosureIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.5" />
      <path d="M8 9h8M8 12h8M8 15h5" strokeWidth="1.25" className={accent} />
    </BaseIcon>
  );
}

/** Inspection — magnifier over square */
function InspectionIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="5" y="5" width="9" height="9" rx="1.5" strokeWidth="1.5" />
      <circle cx="15.5" cy="15.5" r="3.5" className={accent} strokeWidth="1.5" />
      <path d="M17.5 17.5L20 20" strokeWidth="1.5" strokeLinecap="round" />
    </BaseIcon>
  );
}

/** Loan — currency + doc */
function LoanIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 4v16M9 8h4a2 2 0 010 4H9m3 4h3" className={accent} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 4h10v16H7z" strokeWidth="1.5" strokeLinejoin="round" />
    </BaseIcon>
  );
}

/** Title — shield / seal */
function TitleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path
        d="M12 3l8 4v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V7l8-4z"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-5" className={accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </BaseIcon>
  );
}

/** Photos — landscape frame */
function PhotosIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth="1.5" />
      <circle cx="9" cy="11" r="2" className={accent} strokeWidth="1.25" />
      <path d="M4 18l5-5 4 4 4-4 5 6" strokeWidth="1.25" strokeLinejoin="round" />
    </BaseIcon>
  );
}

const DocumentIcons = {
  contract: ContractIcon,
  disclosure: DisclosureIcon,
  inspection: InspectionIcon,
  loan: LoanIcon,
  title: TitleIcon,
  photos: PhotosIcon,
};

export {
  DocumentIcons,
  ContractIcon,
  DisclosureIcon,
  InspectionIcon,
  LoanIcon,
  TitleIcon,
  PhotosIcon,
};
