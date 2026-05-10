"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

type TenantRow = {
  id: string;
  name: string;
  slug: string;
  settings?: Record<string, unknown>;
  is_suspended: boolean;
  seat_limit: number;
  usage: { activeUsers: number; pendingRequests: number; tenantAdmins: number; seatsAssigned?: number };
};

type TenantUserRow = {
  id: string;
  email: string;
  role: string;
  full_name: string | null;
};

type TenantDetail = {
  id: string;
  name: string;
  slug: string;
  seat_limit: number;
  is_suspended: boolean;
  settings: Record<string, unknown>;
  primaryContact: { id: string; email: string; full_name: string | null; role: string } | null;
  usage: { seatsAssigned: number; seatsPending: number };
};

async function csrfHeader(): Promise<Record<string, string> | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json()) as { csrfToken?: string };
  if (!json.csrfToken) return null;
  return { [CSRF_HEADER_NAME]: json.csrfToken };
}

export function GlobalAdminConsole() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [tenantDetail, setTenantDetail] = useState<TenantDetail | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUserRow[]>([]);
  const [selectedCandidateUserId, setSelectedCandidateUserId] = useState("");
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<"name" | "assigned" | "limit">("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDetail, setEditingDetail] = useState(false);
  const [detailDraft, setDetailDraft] = useState<Record<string, string>>({});
  const [resetDrafts, setResetDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [mounted, setMounted] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/global/tenants", { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as { tenants?: TenantRow[]; error?: string };
    if (res.ok && body.tenants) setTenants(body.tenants);
    else setMsg(body.error ?? "Could not load tenants");
  }

  async function refreshUsers(tenantId: string) {
    const res = await fetch(`/api/admin/global/tenants/${tenantId}/users?candidates=1`, {
      credentials: "include",
    });
    const body = (await res.json().catch(() => ({}))) as { users?: TenantUserRow[]; error?: string };
    if (res.ok && body.users) {
      const users = body.users;
      setTenantUsers(users);
      setSelectedCandidateUserId((prev) => prev || users[0]?.id || "");
    }
    else setMsg(body.error ?? "Could not load tenant users");
  }

  async function refreshTenantDetail(tenantId: string) {
    const res = await fetch(`/api/admin/global/tenants/${tenantId}`, { credentials: "include" });
    const body = (await res.json().catch(() => ({}))) as { tenant?: TenantDetail; error?: string };
    if (res.ok && body.tenant) {
      setTenantDetail(body.tenant);
      const s = body.tenant.settings ?? {};
      setDetailDraft({
        name: body.tenant.name,
        seatLimit: String(body.tenant.seat_limit),
        companyType: String(s.companyType ?? ""),
        companyEmail: String(s.companyEmail ?? ""),
        companyPhone: String(s.companyPhone ?? ""),
        website: String(s.website ?? ""),
        address1: String(s.address1 ?? ""),
        address2: String(s.address2 ?? ""),
        city: String(s.city ?? ""),
        state: String(s.state ?? ""),
        postalCode: String(s.postalCode ?? ""),
        country: String(s.country ?? ""),
        notes: String(s.notes ?? ""),
      });
    } else {
      setMsg(body.error ?? "Could not load tenant detail");
    }
  }

  useEffect(() => {
    setMounted(true);
    void refresh();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) return;
    void refreshUsers(selectedTenantId);
    void refreshTenantDetail(selectedTenantId);
  }, [selectedTenantId]);

  if (!mounted) {
    return <div className="rounded-brand-md border border-neutral-200 bg-white p-4" />;
  }

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
        companyType: String(form.get("companyType") ?? ""),
        companyEmail: String(form.get("companyEmail") ?? ""),
        companyPhone: String(form.get("companyPhone") ?? ""),
        website: String(form.get("website") ?? ""),
        address1: String(form.get("address1") ?? ""),
        address2: String(form.get("address2") ?? ""),
        city: String(form.get("city") ?? ""),
        state: String(form.get("state") ?? ""),
        postalCode: String(form.get("postalCode") ?? ""),
        country: String(form.get("country") ?? ""),
        notes: String(form.get("notes") ?? ""),
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
    setShowCreate(false);
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
    await refresh();
    await refreshUsers(String(form.get("tenantId") ?? selectedTenantId));
    setMsg("Tenant admin assigned.");
  }

  async function createTenantUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedTenantId) {
      setMsg("Choose a tenant first.");
      return;
    }
    setBusy(true);
    setMsg("");
    const form = new FormData(e.currentTarget);
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch(`/api/admin/global/tenants/${selectedTenantId}/users`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        fullName: String(form.get("fullName") ?? ""),
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Create account failed");
      return;
    }
    e.currentTarget.reset();
    await refreshUsers(selectedTenantId);
    await refresh();
    setMsg("User created.");
  }

  async function resetPassword(userId: string, password: string) {
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch(`/api/admin/global/users/${userId}/password`, {
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
    setMsg("Password updated.");
  }

  async function saveTenantDetail() {
    if (!tenantDetail) return;
    setBusy(true);
    setMsg("");
    const headers = await csrfHeader();
    if (!headers) return setBusy(false);
    const res = await fetch(`/api/admin/global/tenants/${tenantDetail.id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({
        name: detailDraft.name,
        seatLimit: Number(detailDraft.seatLimit || tenantDetail.seat_limit),
        companyType: detailDraft.companyType,
        companyEmail: detailDraft.companyEmail,
        companyPhone: detailDraft.companyPhone,
        website: detailDraft.website,
        address1: detailDraft.address1,
        address2: detailDraft.address2,
        city: detailDraft.city,
        state: detailDraft.state,
        postalCode: detailDraft.postalCode,
        country: detailDraft.country,
        notes: detailDraft.notes,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMsg(body.error ?? "Tenant update failed");
      return;
    }
    await refresh();
    await refreshTenantDetail(tenantDetail.id);
    setEditingDetail(false);
    setMsg("Tenant updated.");
  }

  const filtered = tenants.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q) ||
      t.slug.toLowerCase().includes(q)
    );
  });
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "name") cmp = a.name.localeCompare(b.name);
    if (sortKey === "assigned")
      cmp = (a.usage.activeUsers + a.usage.pendingRequests) - (b.usage.activeUsers + b.usage.pendingRequests);
    if (sortKey === "limit") cmp = a.seat_limit - b.seat_limit;
    return sortAsc ? cmp : -cmp;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="gold" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Close Create Tenant" : "Create Tenant"}
        </Button>
        <Input
          label="Search tenants"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Company, tenant id, slug"
          className="max-w-md"
        />
      </div>

      {showCreate ? (
        <form onSubmit={createTenant} className="grid gap-3 rounded-brand-md border border-neutral-200 bg-white p-4">
          <h3 className="font-display text-lg text-brand-navy">Create tenant account</h3>
          <Input label="Company name" name="name" required />
          <Input label="Slug (optional)" name="slug" />
          <Input label="Company type" name="companyType" />
          <Input label="Company email" type="email" name="companyEmail" />
          <Input label="Company phone" name="companyPhone" />
          <Input label="Website" name="website" />
          <Input label="Address line 1" name="address1" />
          <Input label="Address line 2" name="address2" />
          <Input label="City" name="city" />
          <Input label="State" name="state" />
          <Input label="Postal code" name="postalCode" />
          <Input label="Country" name="country" />
          <Input label="Seat limit" name="seatLimit" type="number" min={1} defaultValue={25} required />
          <Input label="Notes" name="notes" />
          <Button variant="gold" type="submit" disabled={busy}>
            Save tenant
          </Button>
        </form>
      ) : null}

      <div className="rounded-brand-md border border-neutral-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <h3 className="font-display text-lg text-brand-navy">Tenants</h3>
          <Button size="sm" variant="secondary" onClick={() => { setSortKey("name"); setSortAsc((v) => !v); }}>
            Sort Company {sortKey === "name" ? (sortAsc ? "↑" : "↓") : ""}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setSortKey("assigned"); setSortAsc((v) => !v); }}>
            Sort Seats Assigned {sortKey === "assigned" ? (sortAsc ? "↑" : "↓") : ""}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => { setSortKey("limit"); setSortAsc((v) => !v); }}>
            Sort Seat Limit {sortKey === "limit" ? (sortAsc ? "↑" : "↓") : ""}
          </Button>
        </div>
        <div className="space-y-3">
          {sorted.map((t) => (
            <div key={t.id} className="rounded-brand-md border border-neutral-200 p-3">
              <button
                type="button"
                className="font-sans text-sm font-semibold text-brand-navy underline underline-offset-2"
                onClick={() => {
                  setSelectedTenantId(t.id);
                  void refreshUsers(t.id);
                  void refreshTenantDetail(t.id);
                }}
              >
                {t.name}
              </button>
              <p className="font-mono text-xs text-neutral-600">Tenant ID: {t.id}</p>
              <p className="mt-1 font-sans text-xs text-neutral-600">
                Seats assigned: {t.usage.activeUsers + t.usage.pendingRequests} · Seat limit:{" "}
                {t.seat_limit}
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
          {sorted.length === 0 ? (
            <p className="font-sans text-sm text-neutral-600">No tenants yet.</p>
          ) : null}
        </div>
      </div>

      {selectedTenantId && tenantDetail ? (
        <div className="space-y-4 rounded-brand-md border border-neutral-200 bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-lg text-brand-navy">Tenant detail (read-only)</h3>
            <Button size="sm" variant="secondary" onClick={() => setEditingDetail((v) => !v)}>
              {editingDetail ? "Cancel Edit" : "Edit"}
            </Button>
            {editingDetail ? (
              <Button size="sm" variant="gold" disabled={busy} onClick={() => void saveTenantDetail()}>
                Save
              </Button>
            ) : null}
          </div>
          <p className="font-sans text-sm text-neutral-700">
            <span className="font-semibold">{tenantDetail.name}</span> · seat limit{" "}
            <span className="font-semibold">{tenantDetail.seat_limit}</span> · assigned{" "}
            <span className="font-semibold">{tenantDetail.usage.seatsAssigned}</span>
          </p>
          <p className="font-sans text-xs text-neutral-600">
            Primary contact:{" "}
            {tenantDetail.primaryContact
              ? `${tenantDetail.primaryContact.full_name ?? "—"} (${tenantDetail.primaryContact.email})`
              : "Not set"}
          </p>
          <p className="font-mono text-xs text-neutral-600">Tenant ID: {tenantDetail.id}</p>

          <div className="grid gap-2">
            <Input
              label="Company name"
              value={detailDraft.name ?? ""}
              onChange={(e) => setDetailDraft((p) => ({ ...p, name: e.target.value }))}
              disabled={!editingDetail}
            />
            <Input
              label="Seat limit"
              type="number"
              value={detailDraft.seatLimit ?? ""}
              onChange={(e) => setDetailDraft((p) => ({ ...p, seatLimit: e.target.value }))}
              disabled={!editingDetail}
            />
            <Input label="Company type" value={detailDraft.companyType ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, companyType: e.target.value }))} disabled={!editingDetail} />
            <Input label="Company email" value={detailDraft.companyEmail ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, companyEmail: e.target.value }))} disabled={!editingDetail} />
            <Input label="Company phone" value={detailDraft.companyPhone ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, companyPhone: e.target.value }))} disabled={!editingDetail} />
            <Input label="Website" value={detailDraft.website ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, website: e.target.value }))} disabled={!editingDetail} />
            <Input label="Address line 1" value={detailDraft.address1 ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, address1: e.target.value }))} disabled={!editingDetail} />
            <Input label="Address line 2" value={detailDraft.address2 ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, address2: e.target.value }))} disabled={!editingDetail} />
            <Input label="City" value={detailDraft.city ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, city: e.target.value }))} disabled={!editingDetail} />
            <Input label="State" value={detailDraft.state ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, state: e.target.value }))} disabled={!editingDetail} />
            <Input label="Postal code" value={detailDraft.postalCode ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, postalCode: e.target.value }))} disabled={!editingDetail} />
            <Input label="Country" value={detailDraft.country ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, country: e.target.value }))} disabled={!editingDetail} />
            <Input label="Notes" value={detailDraft.notes ?? ""} onChange={(e) => setDetailDraft((p) => ({ ...p, notes: e.target.value }))} disabled={!editingDetail} />
          </div>

          <form onSubmit={assignTenantAdmin} className="grid gap-3 border border-neutral-200 rounded-brand-md p-3">
            <h4 className="font-display text-base text-brand-navy">Assign tenant admin candidate</h4>
            <input type="hidden" name="tenantId" value={selectedTenantId} />
            <div className="flex w-full flex-col gap-1.5">
              <label className="font-sans text-ui-label uppercase tracking-wide text-neutral-900">
                Tenant Admin Candidate
              </label>
              <select
                name="userId"
                value={selectedCandidateUserId}
                onChange={(e) => setSelectedCandidateUserId(e.target.value)}
                className="flex w-full rounded-brand-md border border-neutral-300 bg-white px-3 py-2 font-sans text-ui-body text-neutral-900 shadow-brand-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
                required
              >
                {tenantUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name ? `${u.full_name} — ${u.email}` : u.email}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="secondary" disabled={busy}>
              Assign tenant admin
            </Button>
          </form>

          <form onSubmit={createTenantUser} className="grid gap-3 border border-neutral-200 rounded-brand-md p-3">
            <Input label="Email" name="email" type="email" required />
            <Input label="Full name (optional)" name="fullName" />
            <p className="font-sans text-xs text-neutral-600">
              Global admin assignment is restricted to tenant admin.
            </p>
            <Input label="Temporary password" name="password" type="password" required minLength={8} />
            <Button type="submit" variant="gold" disabled={busy}>
              Create tenant admin
            </Button>
          </form>

          <div className="space-y-2">
            <h4 className="font-display text-base text-brand-navy">Tenant admin candidates</h4>
            {tenantUsers.map((u) => (
              <div key={u.id} className="rounded-brand-md border border-neutral-200 p-3">
                <p className="font-sans text-sm font-semibold text-brand-navy">{u.email}</p>
                <p className="font-sans text-xs text-neutral-600">{u.full_name || "—"}</p>
                <p className="font-mono text-xs text-neutral-500">{u.id}</p>
                <div className="mt-2 flex gap-2">
                  <Input
                    label="New password"
                    name={`pw-${u.id}`}
                    type="password"
                    minLength={8}
                    placeholder="Min 8 chars"
                    value={resetDrafts[u.id] ?? ""}
                    onChange={(e) =>
                      setResetDrafts((prev) => ({ ...prev, [u.id]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => {
                      const value = resetDrafts[u.id] ?? "";
                      if (!value || value.length < 8) {
                        setMsg("Password must be at least 8 characters.");
                        return;
                      }
                      void resetPassword(u.id, value);
                      setResetDrafts((prev) => ({ ...prev, [u.id]: "" }));
                    }}
                  >
                    Change password
                  </Button>
                </div>
              </div>
            ))}
            {tenantUsers.length === 0 ? (
              <p className="font-sans text-sm text-neutral-600">No users in this tenant yet.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {msg ? <p className="font-sans text-sm text-neutral-700">{msg}</p> : null}
    </div>
  );
}

