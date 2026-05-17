import Link from "next/link";
import type React from "react";
import { ArrowLeft, CalendarDays, ExternalLink, FileDown, Pencil, Plus, Upload } from "lucide-react";
import { CrmDeleteButton } from "@/components/crm/crm-action-buttons";
import { CrmRelationshipForm, CrmTaskForm, CrmTouchpointForm } from "@/components/crm/crm-forms";
import { CrmWorkspaceNav } from "@/components/crm/crm-workspace-nav";
import { Button } from "@/components/ui/button";
import { CRM_BOUNDARIES, CRM_PROVIDER_CATALOG, defaultCrmAdapterCapabilities } from "@/lib/crm/catalog";
import {
  getCrmRelationship,
  getCrmTask,
  getCrmTouchpoint,
  listCrmContactOptions,
  listCrmRelationships,
  listCrmTasks,
  listCrmTouchpoints,
  loadCrmDashboard,
  requireCrmActor,
  type CrmWorkspace,
} from "@/lib/crm/queries";
import {
  CRM_ACTION_BUCKET_LABELS,
  bucketCrmActions,
  crmStatusLabel,
  type CrmActionBucketKey,
  type CrmTaskKind,
} from "@/lib/crm/workflows";

type PageProps = {
  workspace: CrmWorkspace;
};

function addContactHref(workspace: CrmWorkspace): string | null {
  return workspace === "tc" ? "/tc/contacts/new" : null;
}

function crmPath(workspace: CrmWorkspace): string {
  return workspace === "tc" ? "/tc/crm" : "/agent/crm";
}

function CrmShell({
  basePath,
  children,
  title,
  subtitle,
  actions,
}: {
  basePath: string;
  children: React.ReactNode;
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <CrmWorkspaceNav basePath={basePath} />
      <header className="border-b border-neutral-300 pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="font-display text-heading-lg text-brand-navy">{title}</h2>
            <p className="mt-1 max-w-3xl font-sans text-ui-body text-neutral-600">{subtitle}</p>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </header>
      {children}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-brand-lg border border-neutral-300 bg-white p-6 font-sans text-sm text-neutral-600 shadow-brand-sm">
      {children}
    </div>
  );
}

function ContactCreateLink({ workspace }: { workspace: CrmWorkspace }) {
  const href = addContactHref(workspace);
  if (!href) {
    return (
      <p className="rounded-brand-lg border border-neutral-300 bg-white p-4 font-sans text-sm text-neutral-600 shadow-brand-sm">
        Contact creation is managed through the Contacts workspace by a TC or tenant admin.
      </p>
    );
  }
  return (
    <Button asChild variant="secondary">
      <Link href={href}>
        <Plus className="size-4" aria-hidden />
        Add contact
      </Link>
    </Button>
  );
}

export async function CrmUpcomingPage({ workspace }: PageProps) {
  const data = await loadCrmDashboard(workspace);
  const basePath = data.basePath;
  const ordered: CrmActionBucketKey[] = ["overdue", "today", "this_week", "this_month", "this_quarter"];

  return (
    <CrmShell
      basePath={basePath}
      title="Upcoming Actions"
      subtitle="Start here for the people work that needs attention now, this week, this month, and this quarter."
      actions={
        <>
          <Button asChild>
            <Link href={`${basePath}/tasks/new`}>
              <Plus className="size-4" aria-hidden />
              Add task
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`${basePath}/reminders/new`}>
              <CalendarDays className="size-4" aria-hidden />
              Add reminder
            </Link>
          </Button>
        </>
      }
    >
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        {ordered.map((key) => (
          <article key={key} className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
            <h3 className="font-display text-heading-sm text-brand-navy">{CRM_ACTION_BUCKET_LABELS[key]}</h3>
            <p className="mt-1 font-sans text-sm text-neutral-600">{data.buckets[key].length} open</p>
            <div className="mt-4 flex flex-col gap-2">
              {data.buckets[key].slice(0, 4).map((task) => (
                <Link
                  key={task.id}
                  href={`${basePath}/${task.kind === "reminder" ? "reminders" : "tasks"}/${task.id}`}
                  className="rounded-brand-md border border-neutral-200 bg-neutral-50 p-3 font-sans text-sm text-brand-navy hover:border-brand-gold"
                >
                  <span className="block font-semibold">{task.title}</span>
                  <span className="text-neutral-600">{task.contactName ?? "No contact"} · {task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date"}</span>
                </Link>
              ))}
              {data.buckets[key].length === 0 ? <p className="font-sans text-sm text-neutral-500">Nothing here.</p> : null}
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-sm text-brand-navy">Recent touch history</h3>
          <div className="mt-4 flex flex-col gap-2">
            {data.recentTouches.map((touch) => (
              <Link key={touch.id} href={`${basePath}/${touch.touchType === "note" ? "notes" : "touch-history"}/${touch.id}`} className="font-sans text-sm text-brand-navy hover:underline">
                {touch.contactName ?? "Contact"} · {crmStatusLabel(touch.touchType)} · {new Date(touch.occurredAt).toLocaleDateString()}
              </Link>
            ))}
            {data.recentTouches.length === 0 ? <p className="font-sans text-sm text-neutral-600">No touch history yet.</p> : null}
          </div>
        </article>
        <article className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-sm text-brand-navy">Contacts</h3>
          <p className="mt-2 font-sans text-sm text-neutral-600">
            CRM records link to shared Choral Point contacts and broker profiles.
          </p>
          <div className="mt-4">
            <ContactCreateLink workspace={workspace} />
          </div>
        </article>
        <article className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-sm text-brand-navy">Connections</h3>
          <p className="mt-2 font-sans text-sm text-neutral-600">
            External CRM sync stays off until a tenant admin or vendor-assisted setup is approved.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-4">
            <Link href={`${basePath}/connections`}>Review connections</Link>
          </Button>
        </article>
      </section>
    </CrmShell>
  );
}

export async function CrmTaskListPage({ workspace, kind }: PageProps & { kind?: CrmTaskKind }) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const tasks = await listCrmTasks(actor, kind);
  const title = kind === "reminder" ? "Reminders" : "Tasks";
  const listPath = kind === "reminder" ? "reminders" : "tasks";

  return (
    <CrmShell
      basePath={basePath}
      title={kind === "reminder" ? title : "Follow-up Tasks"}
      subtitle="Open a row for read-only detail. Use edit when a record needs to change."
      actions={<Button asChild><Link href={`${basePath}/${listPath}/new`}><Plus className="size-4" aria-hidden />New {kind === "reminder" ? "reminder" : "task"}</Link></Button>}
    >
      {tasks.length === 0 ? <EmptyState>No {title.toLowerCase()} yet.</EmptyState> : (
        <div className="overflow-x-auto rounded-brand-lg border border-neutral-300 bg-white shadow-brand-sm">
          <table className="w-full min-w-[760px] text-left font-sans text-sm">
            <thead className="border-b border-neutral-200 text-ui-label uppercase tracking-wide text-neutral-600">
              <tr><th className="p-3">Title</th><th className="p-3">Contact</th><th className="p-3">Due</th><th className="p-3">Priority</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-neutral-100">
                  <td className="p-3"><Link className="font-semibold text-brand-navy hover:underline" href={`${basePath}/${task.kind === "reminder" ? "reminders" : "tasks"}/${task.id}`}>{task.title}</Link></td>
                  <td className="p-3">{task.contactName ?? "None"}</td>
                  <td className="p-3">{task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"}</td>
                  <td className="p-3">{crmStatusLabel(task.priority)}</td>
                  <td className="p-3">{crmStatusLabel(task.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CrmShell>
  );
}

export async function CrmTaskDetailPage({ workspace, id }: PageProps & { id: string }) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const task = await getCrmTask(actor, id);
  const listPath = task.kind === "reminder" ? "reminders" : "tasks";

  return (
    <CrmShell
      basePath={basePath}
      title={task.title}
      subtitle={`${crmStatusLabel(task.kind)} · ${task.contactName ?? "No contact"} · ${task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"}`}
      actions={<><Button asChild variant="secondary"><Link href={`${basePath}/${listPath}`}><ArrowLeft className="size-4" aria-hidden />Back</Link></Button><Button asChild><Link href={`${basePath}/${listPath}/${task.id}/edit`}><Pencil className="size-4" aria-hidden />Edit</Link></Button><CrmDeleteButton endpoint={`/api/crm/tasks/${task.id}`} returnHref={`${basePath}/${listPath}`} /></>}
    >
      <ReadOnlyGrid items={[
        ["Contact", task.contactName ?? "None"],
        ["Due", task.dueAt ? new Date(task.dueAt).toLocaleString() : "No due date"],
        ["Priority", crmStatusLabel(task.priority)],
        ["Status", crmStatusLabel(task.status)],
        ["Segment", task.segment ? crmStatusLabel(task.segment) : "None"],
        ["Details", task.description ?? "None"],
      ]} />
    </CrmShell>
  );
}

export async function CrmTaskEditPage({ workspace, id, kind }: PageProps & { id?: string; kind: CrmTaskKind }) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const [contacts, task] = await Promise.all([
    listCrmContactOptions(actor),
    id ? getCrmTask(actor, id) : Promise.resolve(undefined),
  ]);
  return (
    <CrmShell
      basePath={basePath}
      title={id ? `Edit ${kind === "reminder" ? "reminder" : "task"}` : `New ${kind === "reminder" ? "reminder" : "task"}`}
      subtitle="Save only after the record is ready. Details remain read-only outside edit mode."
      actions={<Button asChild variant="secondary"><Link href={`${basePath}/${kind === "reminder" ? "reminders" : "tasks"}`}><ArrowLeft className="size-4" aria-hidden />Back</Link></Button>}
    >
      <CrmTaskForm basePath={basePath} contacts={contacts} kind={kind} task={task} />
    </CrmShell>
  );
}

export async function CrmTouchListPage({ workspace, noteOnly }: PageProps & { noteOnly?: boolean }) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const rows = await listCrmTouchpoints(actor, noteOnly ? "note" : undefined);
  const section = noteOnly ? "notes" : "touch-history";
  return (
    <CrmShell
      basePath={basePath}
      title={noteOnly ? "Notes" : "Touch history"}
      subtitle={noteOnly ? "Notes are linked to contacts without creating a duplicate people page." : "Calls, emails, meetings, tasks, imports, and notes stay in one searchable timeline."}
      actions={<Button asChild><Link href={`${basePath}/${section}/new`}><Plus className="size-4" aria-hidden />New {noteOnly ? "note" : "touch"}</Link></Button>}
    >
      {rows.length === 0 ? <EmptyState>No records yet.</EmptyState> : (
        <div className="grid grid-cols-1 gap-3">
          {rows.map((row) => (
            <Link key={row.id} href={`${basePath}/${row.touchType === "note" ? "notes" : "touch-history"}/${row.id}`} className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm hover:border-brand-gold">
              <p className="font-display text-heading-sm text-brand-navy">{row.contactName ?? "Contact"}</p>
              <p className="mt-1 font-sans text-sm text-neutral-600">{crmStatusLabel(row.touchType)} · {new Date(row.occurredAt).toLocaleString()}</p>
              {row.body ? <p className="mt-2 line-clamp-2 font-sans text-sm text-neutral-700">{row.body}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </CrmShell>
  );
}

export async function CrmTouchDetailPage({ workspace, id }: PageProps & { id: string }) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const row = await getCrmTouchpoint(actor, id);
  const section = row.touchType === "note" ? "notes" : "touch-history";
  return (
    <CrmShell
      basePath={basePath}
      title={row.contactName ?? "CRM record"}
      subtitle={`${crmStatusLabel(row.touchType)} · ${new Date(row.occurredAt).toLocaleString()}`}
      actions={<><Button asChild variant="secondary"><Link href={`${basePath}/${section}`}><ArrowLeft className="size-4" aria-hidden />Back</Link></Button><Button asChild><Link href={`${basePath}/${section}/${row.id}/edit`}><Pencil className="size-4" aria-hidden />Edit</Link></Button><CrmDeleteButton endpoint={`/api/crm/touchpoints/${row.id}`} returnHref={`${basePath}/${section}`} /></>}
    >
      <ReadOnlyGrid items={[
        ["Contact", row.contactName ?? "None"],
        ["Type", crmStatusLabel(row.touchType)],
        ["Direction", row.direction ? crmStatusLabel(row.direction) : "None"],
        ["Occurred", new Date(row.occurredAt).toLocaleString()],
        ["Notes", row.body ?? "None"],
        ["Outcome", row.outcome ?? "None"],
        ["Next action", row.nextAction ?? "None"],
      ]} />
    </CrmShell>
  );
}

export async function CrmTouchEditPage({ workspace, id, noteOnly }: PageProps & { id?: string; noteOnly?: boolean }) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const [contacts, row] = await Promise.all([
    listCrmContactOptions(actor),
    id ? getCrmTouchpoint(actor, id) : Promise.resolve(undefined),
  ]);
  const section = noteOnly ? "notes" : "touch-history";
  return (
    <CrmShell
      basePath={basePath}
      title={id ? `Edit ${noteOnly ? "note" : "touch"}` : `New ${noteOnly ? "note" : "touch"}`}
      subtitle="Choose an existing contact, or move to Contacts to create one first."
      actions={<Button asChild variant="secondary"><Link href={`${basePath}/${section}`}><ArrowLeft className="size-4" aria-hidden />Back</Link></Button>}
    >
      <CrmTouchpointForm basePath={basePath} contacts={contacts} noteOnly={noteOnly} touchpoint={row} />
    </CrmShell>
  );
}

export async function CrmRelationshipsPage({ workspace }: PageProps) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const rows = await listCrmRelationships(actor);
  return (
    <CrmShell basePath={basePath} title="Relationships" subtitle="Link people together without duplicating contacts." actions={<Button asChild><Link href={`${basePath}/relationships/new`}><Plus className="size-4" aria-hidden />New relationship</Link></Button>}>
      {rows.length === 0 ? <EmptyState>No relationships yet.</EmptyState> : (
        <div className="grid grid-cols-1 gap-3">
          {rows.map((row) => (
            <Link key={row.id} href={`${basePath}/relationships/${row.id}`} className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm hover:border-brand-gold">
              <p className="font-display text-heading-sm text-brand-navy">{row.primaryContactName ?? "Contact"} → {row.relatedContactName ?? "Related contact"}</p>
              <p className="mt-1 font-sans text-sm text-neutral-600">{crmStatusLabel(row.relationshipType)} · {crmStatusLabel(row.status)}</p>
            </Link>
          ))}
        </div>
      )}
    </CrmShell>
  );
}

export async function CrmRelationshipDetailPage({ workspace, id }: PageProps & { id: string }) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const row = await getCrmRelationship(actor, id);
  return (
    <CrmShell
      basePath={basePath}
      title={`${row.primaryContactName ?? "Contact"} relationship`}
      subtitle={`${crmStatusLabel(row.relationshipType)} · ${crmStatusLabel(row.status)}`}
      actions={<><Button asChild variant="secondary"><Link href={`${basePath}/relationships`}><ArrowLeft className="size-4" aria-hidden />Back</Link></Button><Button asChild><Link href={`${basePath}/relationships/${row.id}/edit`}><Pencil className="size-4" aria-hidden />Edit</Link></Button><CrmDeleteButton endpoint={`/api/crm/relationships/${row.id}`} returnHref={`${basePath}/relationships`} /></>}
    >
      <ReadOnlyGrid items={[
        ["Primary contact", row.primaryContactName ?? "None"],
        ["Related contact", row.relatedContactName ?? "None"],
        ["Relationship", crmStatusLabel(row.relationshipType)],
        ["Status", crmStatusLabel(row.status)],
        ["Notes", row.notes ?? "None"],
      ]} />
    </CrmShell>
  );
}

export async function CrmRelationshipEditPage({ workspace, id }: PageProps & { id?: string }) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const [contacts, row] = await Promise.all([
    listCrmContactOptions(actor),
    id ? getCrmRelationship(actor, id) : Promise.resolve(undefined),
  ]);
  return (
    <CrmShell basePath={basePath} title={id ? "Edit relationship" : "New relationship"} subtitle="Relationships draw from existing contacts only." actions={<Button asChild variant="secondary"><Link href={`${basePath}/relationships`}><ArrowLeft className="size-4" aria-hidden />Back</Link></Button>}>
      <CrmRelationshipForm basePath={basePath} contacts={contacts} relationship={row} />
    </CrmShell>
  );
}

export async function CrmSegmentsPage({ workspace }: PageProps) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const tasks = await listCrmTasks(actor);
  const segments = new Map<string, number>();
  for (const task of tasks) segments.set(task.segment ?? "unassigned", (segments.get(task.segment ?? "unassigned") ?? 0) + 1);
  return (
    <CrmShell basePath={basePath} title="Segments" subtitle="SOI, hot, warm, cold, vendor, broker client, prospect, and other groupings for your own CRM work.">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {Array.from(segments.entries()).map(([segment, count]) => (
          <article key={segment} className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
            <p className="font-display text-heading-sm text-brand-navy">{crmStatusLabel(segment)}</p>
            <p className="mt-1 font-sans text-sm text-neutral-600">{count} open or historical actions</p>
          </article>
        ))}
        {segments.size === 0 ? <EmptyState>No segment activity yet.</EmptyState> : null}
      </section>
    </CrmShell>
  );
}

export async function CrmCalendarPage({ workspace }: PageProps) {
  const actor = await requireCrmActor(workspace);
  const basePath = crmPath(workspace);
  const tasks = await listCrmTasks(actor);
  const buckets = bucketCrmActions(tasks);
  return (
    <CrmShell basePath={basePath} title="Calendar" subtitle="Internal CRM calendar view for tasks and reminders. External Outlook, Google, Apple, and CRM calendar wiring is queued for the integration sprint.">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {(["today", "this_week", "this_month", "this_quarter", "later"] as CrmActionBucketKey[]).map((key) => (
          <article key={key} className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
            <h3 className="font-display text-heading-sm text-brand-navy">{CRM_ACTION_BUCKET_LABELS[key]}</h3>
            <div className="mt-3 flex flex-col gap-2">
              {buckets[key].map((task) => <Link key={task.id} href={`${basePath}/${task.kind === "reminder" ? "reminders" : "tasks"}/${task.id}`} className="font-sans text-sm text-brand-navy hover:underline">{task.title}</Link>)}
              {buckets[key].length === 0 ? <p className="font-sans text-sm text-neutral-600">No items.</p> : null}
            </div>
          </article>
        ))}
      </section>
    </CrmShell>
  );
}

export async function CrmImportExportPage({ workspace }: PageProps) {
  const basePath = crmPath(workspace);
  await requireCrmActor(workspace);
  return (
    <CrmShell basePath={basePath} title="Import / Export" subtitle="CSV and VCF entry points are available now. Import parsing is intentionally staged behind review so contacts do not get duplicated silently.">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-sm text-brand-navy">Export contacts</h3>
          <p className="mt-2 font-sans text-sm text-neutral-600">Download tenant contacts that can be used by your CRM workflow.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild variant="secondary"><a href="/api/crm/export?format=csv"><FileDown className="size-4" aria-hidden />CSV</a></Button>
            <Button asChild variant="secondary"><a href="/api/crm/export?format=vcf"><FileDown className="size-4" aria-hidden />VCF</a></Button>
          </div>
        </article>
        <article className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-sm text-brand-navy">Import contacts</h3>
          <p className="mt-2 font-sans text-sm text-neutral-600">CSV and VCF import will route through a review queue before contacts are created or matched.</p>
          <Button type="button" variant="secondary" disabled className="mt-4"><Upload className="size-4" aria-hidden />Import review queue pending</Button>
        </article>
      </section>
    </CrmShell>
  );
}

export async function CrmConnectionsPage({ workspace }: PageProps) {
  const basePath = crmPath(workspace);
  await requireCrmActor(workspace);
  return (
    <CrmShell basePath={basePath} title="External CRM Connections" subtitle="Connection candidates are listed for planning. Tenant-admin setup and vendor-assisted credentials move to the later integration sprint.">
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {CRM_PROVIDER_CATALOG.map((provider) => (
          <article key={provider.key} className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
            <p className="font-display text-heading-sm text-brand-navy">{provider.label}</p>
            <p className="mt-1 font-sans text-xs font-semibold uppercase tracking-wide text-neutral-600">{crmStatusLabel(provider.status)} · {provider.authModes.join(", ")}</p>
            <p className="mt-2 font-sans text-sm text-neutral-700">{provider.summary}</p>
            <p className="mt-2 font-sans text-sm font-semibold text-brand-brown">{provider.guardrail}</p>
            <ul className="mt-3 space-y-1 font-sans text-xs text-neutral-600">
              {defaultCrmAdapterCapabilities(provider.key).map((capability) => (
                <li key={capability.operation}>{crmStatusLabel(capability.operation)} · disabled</li>
              ))}
            </ul>
            <Button type="button" variant="secondary" size="sm" disabled className="mt-4">
              <ExternalLink className="size-4" aria-hidden />
              Setup pending
            </Button>
          </article>
        ))}
      </section>
    </CrmShell>
  );
}

export async function CrmBoundariesPage({ workspace }: PageProps) {
  const basePath = crmPath(workspace);
  await requireCrmActor(workspace);
  return (
    <CrmShell basePath={basePath} title="CRM scope" subtitle="Current internal CRM capabilities and the boundaries for this build.">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CRM_BOUNDARIES.map((boundary) => (
          <article key={boundary} className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
            <p className="font-sans text-sm font-semibold text-brand-navy">{boundary}</p>
          </article>
        ))}
      </section>
    </CrmShell>
  );
}

function ReadOnlyGrid({ items }: { items: Array<[string, string]> }) {
  return (
    <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {items.map(([labelText, value]) => (
        <div key={labelText} className="rounded-brand-lg border border-neutral-300 bg-white p-4 shadow-brand-sm">
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">{labelText}</p>
          <p className="mt-2 whitespace-pre-wrap font-sans text-sm text-neutral-800">{value}</p>
        </div>
      ))}
    </section>
  );
}
