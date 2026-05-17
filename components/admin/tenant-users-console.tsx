"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type TenantUserRow = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  phone?: string | null;
  group?: string;
};

const GROUPS = ["Admin", "TC", "Broker", "Client", "Title", "Mortgage"] as const;

function roleForGroup(group: string): string {
  if (group === "Admin") return "admin";
  if (group === "TC") return "tc";
  if (group === "Broker") return "broker";
  if (group === "Title") return "title";
  if (group === "Mortgage") return "mortgage";
  return "buyer";
}

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function TenantUsersConsole() {
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const usersRes = await fetch("/api/admin/tenant/users", { credentials: "include" });
    const usersBody = (await usersRes.json().catch(() => ({}))) as {
      users?: TenantUserRow[];
      error?: string;
    };
    if (usersRes.ok && usersBody.users) setUsers(usersBody.users);
    else setMsg(usersBody.error ?? "Could not load tenant users");
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const form = new FormData(e.currentTarget);
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch("/api/admin/tenant/users", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role: roleForGroup(String(form.get("group") ?? "TC")),
        fullName: String(form.get("fullName") ?? ""),
        phone: String(form.get("phone") ?? ""),
        group: String(form.get("group") ?? "TC"),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Create account failed");
      return;
    }
    e.currentTarget.reset();
    await refresh();
    setMsg("User created.");
  }
  async function sendInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg("");
    const form=new FormData(e.currentTarget); const headers=await csrfHeader(); if(!headers)return setBusy(false);
    const group=String(form.get("group") ?? "TC");
    const res=await fetch("/api/admin/tenant/invites",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json",...headers},body:JSON.stringify({email:String(form.get("email")??""),role:roleForGroup(group)})});
    setBusy(false); if(!res.ok)return setMsg("Invite email failed."); e.currentTarget.reset(); setMsg("Invite email sent.");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createUser} className="grid gap-3 rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="font-display text-lg text-brand-navy">Create tenant user account</h3>
        <Input label="Email" type="email" name="email" required />
        <Input label="Full name (optional)" name="fullName" />
        <div className="flex w-full flex-col gap-1.5">
          <label className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
            Role Group
          </label>
          <select
            name="group"
            defaultValue="TC"
            className="flex w-full rounded-brand-md border border-neutral-300 bg-white px-3 py-2 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            {GROUPS.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
        <Input label="Phone (optional)" name="phone" />
        <Input label="Temporary password" name="password" type="password" required minLength={8} />
        <Button variant="gold" type="submit" disabled={busy}>
          Create account
        </Button>
      </form>
      <form onSubmit={sendInvite} className="grid gap-3 rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="font-display text-lg text-brand-navy">Send account invite email</h3>
        <Input label="Email" type="email" name="email" required />
        <label className="flex flex-col gap-1.5 font-sans text-sm"><span>Role group</span><select name="group" defaultValue="TC" className="rounded border border-neutral-300 bg-white px-3 py-2">{GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>
        <Button variant="secondary" type="submit" disabled={busy}>Send invite email</Button>
      </form>

      <div className="rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="mb-3 font-display text-lg text-brand-navy">All users in your tenant</h3>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="rounded-brand-md border border-neutral-200 p-3">
              <p className="font-sans text-sm font-semibold text-brand-navy">{u.email}</p>
              <p className="font-sans text-xs text-neutral-600">
                {u.full_name || "—"} · {u.role} · {u.group ?? "—"}
              </p>
              <p className="font-mono text-xs text-neutral-500">{u.id}</p>
              <div className="mt-2">
                <Link href={`/admin/tenant/users/${u.id}`}>
                  <Button size="sm" variant="secondary" disabled={busy}>
                    Open profile
                  </Button>
                </Link>
              </div>
            </div>
          ))}
          {users.length === 0 ? (
            <p className="font-sans text-sm text-neutral-600">No users in your tenant yet.</p>
          ) : null}
        </div>
      </div>
      {msg ? <p className="font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}
