"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type TenantUserRow = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
  group?: string;
};

const GROUPS = ["Admin", "TC", "Broker", "Client", "Title", "Mortgage"] as const;

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function TenantGroupsConsole() {
  const [users, setUsers] = useState<TenantUserRow[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<(typeof GROUPS)[number]>("Admin");
  const [selectedUser, setSelectedUser] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function refresh() {
    const res = await fetch("/api/admin/tenant/users", { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as { users?: TenantUserRow[]; error?: string };
    if (res.ok && body.users) setUsers(body.users);
    else setMsg(body.error ?? "Could not load tenant users");
  }

  useEffect(() => {
    void refresh();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<(typeof GROUPS)[number], TenantUserRow[]>();
    for (const g of GROUPS) map.set(g, []);
    for (const u of users) {
      const key = GROUPS.includes((u.group ?? "") as (typeof GROUPS)[number])
        ? (u.group as (typeof GROUPS)[number])
        : "Client";
      map.get(key)?.push(u);
    }
    return map;
  }, [users]);

  async function assignUserToGroup() {
    const match = users.find((u) => u.id === selectedUser || u.email.toLowerCase() === selectedUser.toLowerCase());
    if (!match) {
      setMsg("Choose a user to assign.");
      return;
    }
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch(`/api/admin/tenant/users/${match.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ group: selectedGroup }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Group assignment failed");
      return;
    }
    await refresh();
    setMsg("User assigned to group.");
  }

  return (
    <div className="space-y-4 rounded-brand-md border border-neutral-200 bg-white p-4">
      <h3 className="mb-3 font-display text-lg text-brand-navy">Groups</h3>
      <div className="grid gap-2 rounded-brand-md border border-neutral-200 p-3">
        <Input
          label="Group"
          value={selectedGroup}
          onChange={(e) => setSelectedGroup((e.target.value || "Admin") as (typeof GROUPS)[number])}
        />
        <Input
          label="User id or email"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          placeholder="Paste user id or email from list below"
        />
        <Button variant="gold" disabled={busy} onClick={() => void assignUserToGroup()}>
          Add user to group
        </Button>
      </div>
      <div className="space-y-3">
        {GROUPS.map((group) => {
          const rows = grouped.get(group) ?? [];
          return (
            <div key={group} className="rounded-brand-md border border-neutral-200 p-3">
              <p className="font-sans text-sm font-semibold text-brand-navy">
                {group} <span className="text-neutral-500">({rows.length})</span>
              </p>
              <div className="mt-2">
                <Button size="sm" variant="secondary" onClick={() => setSelectedGroup(group)}>
                  Add users to {group}
                </Button>
              </div>
              {rows.length === 0 ? (
                <p className="mt-1 text-xs text-neutral-600">No users assigned yet.</p>
              ) : (
                <div className="mt-1 space-y-1 text-xs text-neutral-600">
                  {rows.map((u) => (
                    <p key={u.id}>
                      {u.email} <span className="font-mono text-[10px] text-neutral-500">({u.id})</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {msg ? <p className="mt-2 font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}

