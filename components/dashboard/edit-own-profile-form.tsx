"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function EditOwnProfileForm() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/me/profile", { credentials: "include" });
      const body = (await res.json().catch(() => ({}))) as {
        profile?: { full_name?: string | null; phone?: string | null };
      };
      if (res.ok && body.profile) {
        setFullName(body.profile.full_name ?? "");
        setPhone(body.profile.phone ?? "");
      }
    })();
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) {
      setBusy(false);
      setMsg("Could not validate request. Please try again.");
      return;
    }
    const res = await fetch("/api/me/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ fullName: fullName || null, phone: phone || null }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    setMsg(res.ok ? "Profile updated." : body.error ?? "Profile update failed.");
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3 border-t border-neutral-200 pt-6">
      <h3 className="font-display text-lg text-brand-navy">Profile details</h3>
      <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Button variant="secondary" type="submit" disabled={busy}>
        Save profile
      </Button>
      {msg ? <p className="text-sm text-neutral-700">{msg}</p> : null}
    </form>
  );
}
