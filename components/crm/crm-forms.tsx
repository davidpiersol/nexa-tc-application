"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";
import type { CrmContactOption, CrmRelationshipRow, CrmTaskRow, CrmTouchpointRow } from "@/lib/crm/queries";
import {
  CRM_RELATIONSHIP_TYPES,
  CRM_SEGMENTS,
  CRM_TASK_PRIORITIES,
  CRM_TASK_STATUSES,
  CRM_TOUCH_DIRECTIONS,
  CRM_TOUCH_TYPES,
  crmDateInputValue,
  crmStatusLabel,
} from "@/lib/crm/workflows";

async function csrfToken(): Promise<string | null> {
  const res = await fetch("/api/csrf", { credentials: "include" });
  const json = (await res.json().catch(() => ({}))) as { csrfToken?: string };
  return json.csrfToken ?? null;
}

function label(value: string): string {
  return crmStatusLabel(value);
}

function ContactSearchField({
  contacts,
  name,
  defaultValue,
  required,
}: {
  contacts: CrmContactOption[];
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <SearchableSelect
      label="Contact"
      name={name}
      defaultValue={defaultValue}
      required={required}
      placeholder="Search contacts"
      options={contacts.map((contact) => ({
        value: contact.id,
        label: contact.label,
      }))}
    />
  );
}

export function CrmTaskForm({
  basePath,
  contacts,
  kind,
  task,
}: {
  basePath: string;
  contacts: CrmContactOption[];
  kind: "follow_up" | "reminder";
  task?: CrmTaskRow;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isReminder = kind === "reminder";

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("Security token unavailable.");
      const body = Object.fromEntries(formData.entries());
      const endpoint = task ? `/api/crm/tasks/${task.id}` : "/api/crm/tasks";
      const res = await fetch(endpoint, {
        method: task ? "PATCH" : "POST",
        credentials: "include",
        headers: { "content-type": "application/json", [CSRF_HEADER_NAME]: token },
        body: JSON.stringify({ ...body, kind }),
      });
      const json = (await res.json().catch(() => ({}))) as { task?: { id?: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed.");
      router.push(`${basePath}/${isReminder ? "reminders" : "tasks"}/${json.task?.id ?? task?.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  const defaultDue = useMemo(() => crmDateInputValue(task?.dueAt), [task?.dueAt]);

  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
      className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800 lg:col-span-2">
          Title
          <input name="title" defaultValue={task?.title ?? ""} required className="rounded-brand-md border border-neutral-300 px-3 py-2" />
        </label>
        <ContactSearchField contacts={contacts} name="contactId" defaultValue={task?.contactId} />
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
          Due
          <input name="dueAt" type="datetime-local" defaultValue={defaultDue} className="rounded-brand-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
          Priority
          <select name="priority" defaultValue={task?.priority ?? "medium"} className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2">
            {CRM_TASK_PRIORITIES.map((priority) => <option key={priority} value={priority}>{label(priority)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
          Status
          <select name="status" defaultValue={task?.status ?? "open"} className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2">
            {CRM_TASK_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
          Segment
          <select name="segment" defaultValue={task?.segment ?? ""} className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2">
            <option value="">None</option>
            {CRM_SEGMENTS.map((segment) => <option key={segment} value={segment}>{label(segment)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800 lg:col-span-2">
          Details
          <textarea name="description" defaultValue={task?.description ?? ""} rows={5} className="rounded-brand-md border border-neutral-300 px-3 py-2" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" loading={loading}>
          <Save className="size-4" aria-hidden />
          Save
        </Button>
        {error ? <p className="font-sans text-sm text-status-danger">{error}</p> : null}
      </div>
    </form>
  );
}

export function CrmTouchpointForm({
  basePath,
  contacts,
  noteOnly,
  touchpoint,
}: {
  basePath: string;
  contacts: CrmContactOption[];
  noteOnly?: boolean;
  touchpoint?: CrmTouchpointRow;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("Security token unavailable.");
      const body = Object.fromEntries(formData.entries());
      const endpoint = touchpoint ? `/api/crm/touchpoints/${touchpoint.id}` : "/api/crm/touchpoints";
      const res = await fetch(endpoint, {
        method: touchpoint ? "PATCH" : "POST",
        credentials: "include",
        headers: { "content-type": "application/json", [CSRF_HEADER_NAME]: token },
        body: JSON.stringify({ ...body, touchType: noteOnly ? "note" : body.touchType }),
      });
      const json = (await res.json().catch(() => ({}))) as { touchpoint?: { id?: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed.");
      router.push(`${basePath}/${noteOnly ? "notes" : "touch-history"}/${json.touchpoint?.id ?? touchpoint?.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
      className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ContactSearchField contacts={contacts} name="contactId" defaultValue={touchpoint?.contactId} required />
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
          Date
          <input name="occurredAt" type="datetime-local" defaultValue={crmDateInputValue(touchpoint?.occurredAt)} className="rounded-brand-md border border-neutral-300 px-3 py-2" />
        </label>
        {noteOnly ? null : (
          <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
            Touch type
            <select name="touchType" defaultValue={touchpoint?.touchType ?? "call"} className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2">
              {CRM_TOUCH_TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
          Direction
          <select name="direction" defaultValue={touchpoint?.direction ?? "internal"} className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2">
            {CRM_TOUCH_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{label(direction)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800 lg:col-span-2">
          Notes
          <textarea name="body" defaultValue={touchpoint?.body ?? ""} rows={5} className="rounded-brand-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800 lg:col-span-2">
          Outcome
          <textarea name="outcome" defaultValue={touchpoint?.outcome ?? ""} rows={3} className="rounded-brand-md border border-neutral-300 px-3 py-2" />
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800 lg:col-span-2">
          Next action
          <textarea name="nextAction" defaultValue={touchpoint?.nextAction ?? ""} rows={3} className="rounded-brand-md border border-neutral-300 px-3 py-2" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" loading={loading}>
          <Save className="size-4" aria-hidden />
          Save
        </Button>
        {error ? <p className="font-sans text-sm text-status-danger">{error}</p> : null}
      </div>
    </form>
  );
}

export function CrmRelationshipForm({
  basePath,
  contacts,
  relationship,
}: {
  basePath: string;
  contacts: CrmContactOption[];
  relationship?: CrmRelationshipRow;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      const token = await csrfToken();
      if (!token) throw new Error("Security token unavailable.");
      const body = Object.fromEntries(formData.entries());
      const endpoint = relationship ? `/api/crm/relationships/${relationship.id}` : "/api/crm/relationships";
      const res = await fetch(endpoint, {
        method: relationship ? "PATCH" : "POST",
        credentials: "include",
        headers: { "content-type": "application/json", [CSRF_HEADER_NAME]: token },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { relationship?: { id?: string }; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed.");
      router.push(`${basePath}/relationships/${json.relationship?.id ?? relationship?.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
      className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ContactSearchField contacts={contacts} name="primaryContactId" defaultValue={relationship?.primaryContactId} required />
        <ContactSearchField contacts={contacts} name="relatedContactId" defaultValue={relationship?.relatedContactId} />
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
          Relationship
          <select name="relationshipType" defaultValue={relationship?.relationshipType ?? "other"} className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2">
            {CRM_RELATIONSHIP_TYPES.map((type) => <option key={type} value={type}>{label(type)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800">
          Status
          <select name="status" defaultValue={relationship?.status ?? "active"} className="rounded-brand-md border border-neutral-300 bg-white px-3 py-2">
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="flex flex-col gap-1.5 font-sans text-sm text-neutral-800 lg:col-span-2">
          Notes
          <textarea name="notes" defaultValue={relationship?.notes ?? ""} rows={5} className="rounded-brand-md border border-neutral-300 px-3 py-2" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" loading={loading}>
          <Save className="size-4" aria-hidden />
          Save
        </Button>
        {error ? <p className="font-sans text-sm text-status-danger">{error}</p> : null}
      </div>
    </form>
  );
}
