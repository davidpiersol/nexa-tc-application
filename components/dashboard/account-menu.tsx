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
import { createClient } from "@/lib/supabase/client";

function shortEmail(email: string | undefined) {
  if (!email) return "Account";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const trimmed = local.length > 18 ? `${local.slice(0, 16)}…` : local;
  return `${trimmed}@${domain}`;
}

type AccountMenuProps = {
  email?: string | null;
  fullName?: string | null;
  role?: string | null;
};

export function AccountMenu({ email, fullName, role }: AccountMenuProps) {
  const pathname = usePathname();
  const roleSeg = roleFromPathname(pathname);
  const profileHref =
    profileHrefFromPathname(pathname) ??
    (role === "global_admin" || role === "superadmin"
      ? "/admin/global/profile"
      : role === "admin" || role === "tenant_admin"
        ? "/admin/tenant/profile"
        : role === "tc"
          ? "/tc/profile"
          : role === "broker" || role === "agent"
            ? "/agent/profile"
            : null);
  const [open, setOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const [switchingRole, setSwitchingRole] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    void fetch("/api/me/roles", { credentials: "include" })
      .then(async (res) => (res.ok ? ((await res.json()) as { roles?: string[] }) : null))
      .then((body) => setAvailableRoles(body?.roles ?? []))
      .catch(() => setAvailableRoles([]));
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

  async function switchRole(nextRole: string) {
    if (!nextRole || nextRole === role) return;
    setSwitchingRole(true);
    const csrfRes = await fetch("/api/csrf", { credentials: "include" });
    const csrfJson = (await csrfRes.json().catch(() => ({}))) as { csrfToken?: string };
    const res = await fetch("/api/me/roles", {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(csrfJson.csrfToken ? { [CSRF_HEADER_NAME]: csrfJson.csrfToken } : {}),
      },
      body: JSON.stringify({ role: nextRole }),
    });
    if (res.ok) {
      await createClient().auth.refreshSession();
      window.location.assign("/api/auth/role-redirect");
      return;
    }
    setSwitchingRole(false);
  }

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
          <span className="truncate normal-case text-neutral-900">{fullName || shortEmail(email ?? undefined)}</span>
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
          {availableRoles.length > 1 ? (
            <label className="flex flex-col gap-1 border-t border-neutral-200 px-3 py-2 text-xs text-neutral-600">
              Active login type
              <select
                value={role ?? ""}
                disabled={switchingRole}
                onChange={(event) => void switchRole(event.target.value)}
                className="rounded-brand-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900"
              >
                {availableRoles.map((item) => (
                  <option key={item} value={item}>
                    {item === "agent" ? "broker" : item}
                  </option>
                ))}
              </select>
            </label>
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
