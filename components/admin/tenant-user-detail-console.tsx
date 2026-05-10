"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

const GROUPS = ["Admin", "TC", "Broker", "Client", "Title", "Mortgage"] as const;
type GroupValue = (typeof GROUPS)[number];

function roleForGroup(group: GroupValue, currentRole: string): string {
  if (group === "Admin") return "admin";
  if (group === "TC") return "tc";
  if (group === "Broker") return "broker";
  if (group === "Title") return "title";
  if (group === "Mortgage") return "mortgage";
  if (currentRole === "seller" || currentRole === "buyer") return currentRole;
  return "buyer";
}

type UserDetail = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  phone: string | null;
  group: (typeof GROUPS)[number];
};

type Props = { userId: string };

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function TenantUserDetailConsole({ userId }: Props) {
  const router = useRouter();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({
    email: "",
    fullName: "",
    phone: "",
    group: "TC" as GroupValue,
  });

  async function refresh() {
    const res = await fetch(`/api/admin/tenant/users/${userId}`, { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as { user?: UserDetail; error?: string };
    if (!res.ok || !body.user) {
      setMsg(body.error ?? "Could not load user details");
      return;
    }
    setUser(body.user);
    setForm({
      email: body.user.email,
      fullName: body.user.full_name ?? "",
      phone: body.user.phone ?? "",
      group: body.user.group as GroupValue,
    });
  }

  useEffect(() => {
    void refresh();
  }, [userId]);

  async function save() {
    if (!user) return;
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch(`/api/admin/tenant/users/${userId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        email: form.email,
        fullName: form.fullName || null,
        phone: form.phone || null,
        role: roleForGroup(form.group, user.role),
        group: form.group,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Save failed");
      return;
    }
    await refresh();
    setMsg("User profile updated.");
  }

  async function changePassword() {
    if (!password || password.length < 8) {
      setMsg("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch(`/api/admin/tenant/users/${userId}/password`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ password }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Password reset failed");
      return;
    }
    setPassword("");
    setMsg("Password updated.");
  }

  if (!user) {
    return <div className="rounded-brand-md border border-neutral-200 bg-white p-4" />;
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => router.push("/admin/tenant/users")}>
        Back to users
      </Button>
      <div className="rounded-brand-md border border-neutral-200 bg-white p-4 space-y-3">
        <h3 className="font-display text-lg text-brand-navy">User Details</h3>
        <p className="font-mono text-xs text-neutral-500">{user.id}</p>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
        />
        <Input
          label="Full name"
          value={form.fullName}
          onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
        />
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
        />
        <p className="font-sans text-xs text-neutral-600">Current role: {user.role}</p>
        <div className="flex w-full flex-col gap-1.5">
          <label className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Role Group
          </label>
          <select
            className="flex w-full rounded-brand-md border border-neutral-300 bg-white px-3 py-2 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
            value={form.group}
            onChange={(e) => setForm((p) => ({ ...p, group: e.target.value as GroupValue }))}
          >
            {GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        <Button variant="gold" disabled={busy} onClick={() => void save()}>
          Save changes
        </Button>
      </div>

      <div className="rounded-brand-md border border-neutral-200 bg-white p-4 space-y-3">
        <h3 className="font-display text-lg text-brand-navy">Change password</h3>
        <Input
          label="New password"
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button variant="secondary" disabled={busy} onClick={() => void changePassword()}>
          Update password
        </Button>
      </div>

      {msg ? <p className="font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}

