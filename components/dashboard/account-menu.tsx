"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import NexaIcon from "@/components/brand/NexaIcon";
import { formatRoleLabel } from "@/components/dashboard/profile-body";
import { profileHrefFromPathname, roleFromPathname } from "@/lib/dashboard-nav";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import { cn } from "@/lib/utils/cn";

function shortEmail(email: string | undefined) {
  if (!email) return "Account";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const trimmed = local.length > 18 ? `${local.slice(0, 16)}…` : local;
  return `${trimmed}@${domain}`;
}

type AccountMenuProps = {
  email?: string | null;
  role?: string | null;
};

export function AccountMenu({ email, role }: AccountMenuProps) {
  const pathname = usePathname();
  const roleSeg = roleFromPathname(pathname);
  const profileHref = profileHrefFromPathname(pathname);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const displayRole = role ?? roleSeg ?? "";
  const roleLabel = displayRole ? formatRoleLabel(displayRole) : "Workspace";

  const logout = useCallback(async () => {
    const csrfRes = await fetch("/api/csrf", { credentials: "include" });
    const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
    const csrfToken = csrfJson.csrfToken;
    if (!csrfToken) return;

    const logoutRes = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: csrfToken,
      },
    });

    if (logoutRes.ok) {
      window.location.assign("/login");
    }
  }, []);

  if (!roleSeg) return null;

  return (
    <div ref={wrapRef} className="relative ml-auto shrink-0">
      <button
        type="button"
        className={cn(
          "flex max-w-[min(100vw-8rem,18rem)] items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left font-sans text-xs uppercase tracking-wide text-neutral-600 transition-colors",
          "hover:border-neutral-200 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2",
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        <NexaIcon className="size-5 shrink-0 opacity-70" aria-hidden />
        <span className="hidden min-w-0 flex-1 flex-col truncate text-left sm:flex">
          <span className="truncate normal-case text-neutral-900">{shortEmail(email ?? undefined)}</span>
          <span className="truncate text-[10px] text-neutral-500">{roleLabel}</span>
        </span>
        <span className="sm:hidden">Menu</span>
        <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-1 min-w-[12rem] rounded-md border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {profileHref ? (
            <Link
              role="menuitem"
              href={profileHref}
              className="flex items-center gap-2 px-3 py-2 text-sm text-brand-navy hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              <UserIcon className="size-4 shrink-0 opacity-70" aria-hidden />
              Profile
            </Link>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-brand-navy hover:bg-neutral-50"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            <LogOut className="size-4 shrink-0 opacity-70" aria-hidden />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
