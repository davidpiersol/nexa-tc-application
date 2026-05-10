"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  is_suspended: boolean;
  seat_limit: number;
  usage: { activeUsers: number; pendingRequests: number; tenantAdmins: number };
};

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function GlobalAdminConsole() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/global/tenants", { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as { tenants?: TenantRow[]; error?: string };
    if (res.ok && body.tenants) setTenants(body.tenants);
    else setMsg(body.error ?? "Could not load tenants");
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function createTenant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const form = new FormData(e.currentTarget);
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);

    const res = await fetch("/api/admin/global/tenants", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        name: String(form.get("name") ?? ""),
        slug: String(form.get("slug") ?? ""),
        seatLimit: Number(form.get("seatLimit") ?? 25),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Create tenant failed");
      return;
    }
    e.currentTarget.reset();
    await refresh();
    setMsg("Tenant created.");
  }

  async function patchLicense(tenantId: string, seatLimit: number, suspended: boolean) {
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);

    const res = await fetch("/api/admin/global/licenses", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ tenantId, seatLimit, suspended }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "License update failed");
      return;
    }
    await refresh();
  }

  async function assignTenantAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const form = new FormData(e.currentTarget);
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch("/api/admin/global/tenant-admins", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        tenantId: String(form.get("tenantId") ?? ""),
        userId: String(form.get("userId") ?? ""),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Assignment failed");
      return;
    }
    e.currentTarget.reset();
    await refresh();
    setMsg("Tenant admin assigned.");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createTenant} className="grid gap-3 rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="font-display text-lg text-brand-navy">Create tenant</h3>
        <Input label="Tenant name" name="name" required />
        <Input label="Tenant slug" name="slug" required />
        <Input label="Seat limit" name="seatLimit" type="number" min={1} defaultValue={25} required />
        <Button variant="gold" type="submit" disabled={busy}>
          Create tenant
        </Button>
      </form>

      <form onSubmit={assignTenantAdmin} className="grid gap-3 rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="font-display text-lg text-brand-navy">Assign tenant admin</h3>
        <Input label="Tenant id" name="tenantId" required />
        <Input label="User id" name="userId" required />
        <Button type="submit" variant="secondary" disabled={busy}>
          Assign
        </Button>
      </form>

      <div className="rounded-brand-md border border-neutral-200 bg-white p-4">
        <h3 className="mb-3 font-display text-lg text-brand-navy">Tenant roster</h3>
        <div className="space-y-3">
          {tenants.map((t) => (
            <div key={t.id} className="rounded-brand-md border border-neutral-200 p-3">
              <p className="font-sans text-sm font-semibold text-brand-navy">
                {t.name} ({t.slug})
              </p>
              <p className="font-mono text-xs text-neutral-600">{t.id}</p>
              <p className="mt-1 font-sans text-xs text-neutral-600">
                Seats {t.usage.activeUsers + t.usage.pendingRequests}/{t.seat_limit} · active{" "}
                {t.usage.activeUsers} · pending {t.usage.pendingRequests} · tenant admins{" "}
                {t.usage.tenantAdmins}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void patchLicense(t.id, t.seat_limit, !t.is_suspended)}
                >
                  {t.is_suspended ? "Reactivate" : "Suspend"}
                </Button>
              </div>
            </div>
          ))}
          {tenants.length === 0 ? (
            <p className="font-sans text-sm text-neutral-600">No tenants yet.</p>
          ) : null}
        </div>
      </div>

      {msg ? <p className="font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}

