"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type AccessRequest = {
  id: string;
  email: string;
  desired_role: string;
  status: string;
  created_at: string;
};

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function TenantAdminConsole() {
  const [items, setItems] = useState<AccessRequest[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [mounted, setMounted] = useState(false);

  async function refresh() {
    const reqRes = await fetch("/api/admin/tenant/access-requests", { credentials: "include" });
    const reqBody = (await reqRes.json().catch(() => ({}))) as { requests?: AccessRequest[]; error?: string };
    if (reqRes.ok && reqBody.requests) setItems(reqBody.requests);
    else setMsg(reqBody.error ?? "Could not load requests");
  }

  useEffect(() => {
    setMounted(true);
    void refresh();
  }, []);

  if (!mounted) {
    return <div className="rounded-brand-md border border-neutral-200 bg-white p-4" />;
  }

  async function createRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const form = new FormData(e.currentTarget);
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch("/api/admin/tenant/access-requests", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        desiredRole: String(form.get("desiredRole") ?? "tc"),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Invite request failed");
      return;
    }
    e.currentTarget.reset();
    await refresh();
  }

  async function updateRequest(id: string, action: "approve" | "revoke" | "reject") {
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch("/api/admin/tenant/access-requests", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ id, action }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Update failed");
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createRequest} className="grid gap-3 rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="font-display text-lg text-brand-navy">Invite / approval request</h3>
        <Input label="Email" type="email" name="email" required />
        <Input
          label="Desired role (tc, broker, buyer, seller, mortgage, title)"
          name="desiredRole"
          defaultValue="tc"
          required
        />
        <Button variant="gold" type="submit" disabled={busy}>
          Create request
        </Button>
      </form>

      <div className="rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="mb-3 font-display text-lg text-brand-navy">Pending and recent requests</h3>
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-brand-md border border-neutral-200 p-3">
              <p className="font-sans text-sm font-semibold text-brand-navy">{r.email}</p>
              <p className="font-sans text-xs text-neutral-600">
                role: {r.desired_role} · status: {r.status}
              </p>
              <p className="font-mono text-xs text-neutral-500">{r.id}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => void updateRequest(r.id, "approve")}>
                  Approve
                </Button>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => void updateRequest(r.id, "revoke")}>
                  Revoke
                </Button>
                <Button size="sm" variant="ghost" disabled={busy} onClick={() => void updateRequest(r.id, "reject")}>
                  Reject
                </Button>
              </div>
            </div>
          ))}
          {items.length === 0 ? <p className="font-sans text-sm text-neutral-600">No requests yet.</p> : null}
        </div>
      </div>
      {msg ? <p className="font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}
