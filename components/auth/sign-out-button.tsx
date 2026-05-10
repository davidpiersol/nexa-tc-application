"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type Props = {
  variant?: "ghost" | "secondary";
  label?: string;
};

export function SignOutButton({ variant = "ghost", label = "Sign out" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onSignOut() {
    setBusy(true);
    const csrfRes = await fetch("/api/csrf", { credentials: "include" });
    const csrfJson = (await csrfRes.json()) as { csrfToken?: string };
    const csrfToken = csrfJson.csrfToken;
    if (!csrfToken) {
      setBusy(false);
      return;
    }

    const logoutRes = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        [CSRF_HEADER_NAME]: csrfToken,
      },
    });

    setBusy(false);
    if (logoutRes.ok) {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <Button type="button" variant={variant} size="sm" disabled={busy} onClick={() => void onSignOut()}>
      {busy ? "Signing out…" : label}
    </Button>
  );
}
