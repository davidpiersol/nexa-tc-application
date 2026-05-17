import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTransactionDetail,
  listTransactionDocumentSelections,
  listDocumentsForTransaction,
} from "@/lib/queries/transaction-detail";
import { TransactionArchiveActions } from "@/components/tc/transaction-archive-actions";
import { assignmentCategoryLabel, transactionContactRoleLabel } from "@/lib/transactions/contact-assignment";
import { documentStatusToBadge } from "@/lib/ui/map-document-status";
import {
  templateAvailabilityLabel,
  templateSelectionStateLabel,
} from "@/lib/documents/template-selection";

type Props = { params: { id: string } };

/**
 * Figma: **Transaction Detail/Default** → `/tc/transactions/[id]`
 */
export default async function TransactionDetailPage({ params }: Props) {
  const [t, docs, templateSelections] = await Promise.all([
    getTransactionDetail(params.id),
    listDocumentsForTransaction(params.id),
    listTransactionDocumentSelections(params.id),
  ]);
  if (!t) notFound();

  const milestone = String(t.status).replace(/_/g, " ");
  const intake = (t.intake_data ?? {}) as Record<string, unknown>;
  const getString = (key: string): string | null => {
    const v = intake[key];
    if (typeof v !== "string") return null;
    const trimmed = v.trim();
    return trimmed.length ? trimmed : null;
  };
  const legalDescription = getString("property_legal_description");
  const sellerBroker =
    getString("seller_broker_1_broker_name") ?? getString("seller_broker_1_brokerage_firm");
  const buyerBroker =
    getString("buyer_broker_1_broker_name") ?? getString("buyer_broker_1_brokerage_firm");
  const representationRaw = getString("tc_representation_side");
  const representationLabel =
    representationRaw === "seller_listing_broker"
      ? "Seller / Listing broker"
      : representationRaw === "buyer_broker"
        ? "Buyer broker"
        : representationRaw === "both"
          ? "Both sides"
          : null;
  const docsByStatus = docs.reduce(
    (acc, d) => {
      acc.total += 1;
      if (d.status === "under_review") acc.review += 1;
      if (d.status === "requested") acc.signatures += 1;
      return acc;
    },
    { total: 0, review: 0, signatures: 0 },
  );
  const recentDocs = docs.slice(0, 3);
  const isClosed = String(t.status) === "closed";
  const isArchived = Boolean(t.archived_at);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 border-b border-neutral-300 pb-6">
        <div>
          <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
            Transaction · {t.mls_number ? `MLS #${t.mls_number}` : t.id}
          </p>
          <h2 className="mt-2 font-display text-heading-lg text-brand-navy">
            {t.property_address?.trim() || "Property address TBD"}
          </h2>
          <p className="mt-2 font-sans text-ui-body text-neutral-600">
            Status · <span className="text-brand-brown">{milestone}</span>
            {t.first_pass_status ? (
              <>
                {" "}
                · First pass ·{" "}
                <span className="font-medium text-brand-navy">{t.first_pass_status}</span>
              </>
            ) : null}
          </p>
          <p className="mt-1 font-sans text-sm text-neutral-600">
            MLS · {t.mls_number?.trim() || "TBD"}
            {legalDescription ? ` · Legal · ${legalDescription}` : ""}
          </p>
          <p className="mt-1 font-sans text-sm text-neutral-600">
            TC rep · {representationLabel ?? "Not set"}
            {sellerBroker ? ` · Seller broker · ${sellerBroker}` : ""}
            {buyerBroker ? ` · Buyer broker · ${buyerBroker}` : ""}
          </p>
          {isArchived ? (
            <p className="mt-2 inline-flex w-fit rounded-full bg-neutral-200 px-2 py-1 font-sans text-xs text-neutral-700">
              Archived
            </p>
          ) : null}
          <TransactionArchiveActions
            transactionId={params.id}
            canArchive={isClosed}
            isArchived={isArchived}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-md text-brand-navy">Parties</h3>
          <ul className="mt-4 flex flex-col gap-2 font-sans text-ui-body text-neutral-900">
            {t.parties.length === 0 ? (
              <li className="text-neutral-600">No parties linked yet.</li>
            ) : null}
            {t.parties.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/tc/transactions/${params.id}/parties/${p.id}`}
                  className="inline-flex flex-wrap items-center gap-1.5 text-brand-navy underline underline-offset-2"
                >
                  <span className="font-semibold">{p.display_name ?? "Unnamed"}</span>
                  <span className="text-neutral-600">· {String(p.party_role).replace(/_/g, " ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-md text-brand-navy">Documents</h3>
          <p className="mt-3 font-sans text-sm text-neutral-600">
            Total · {docsByStatus.total} · Under review · {docsByStatus.review} · Signature requested
            · {docsByStatus.signatures}
          </p>
          <p className="mt-1 font-sans text-sm text-neutral-600">
            Checklist templates · {templateSelections.length}
          </p>
          <ul className="mt-3 space-y-2">
            {templateSelections.slice(0, 4).map((selection) => {
              const badge = documentStatusToBadge(selection.document_status);
              return (
                <li key={selection.id} className="font-sans text-sm text-neutral-900">
                  <span className="font-medium text-brand-navy">
                    {selection.template?.title ?? "Template"}
                  </span>{" "}
                  · {templateSelectionStateLabel(selection.selection_state)} · {badge.label}
                  {selection.template?.availability_status ? (
                    <> · {templateAvailabilityLabel(selection.template.availability_status)}</>
                  ) : null}
                </li>
              );
            })}
            {templateSelections.length === 0 ? (
              <li className="font-sans text-sm text-neutral-600">
                No template selections yet.
              </li>
            ) : null}
          </ul>
          <p className="mt-2">
            <Link
              href={`/tc/transactions/${params.id}/documents`}
              className="font-sans text-sm text-brand-navy underline underline-offset-2"
            >
              Open document manager checklist
            </Link>
          </p>
          <ul className="mt-3 space-y-2">
            {recentDocs.map((d) => (
              <li key={d.id} className="font-sans text-sm text-neutral-900">
                <Link
                  href={`/tc/transactions/${params.id}/documents/${d.id}`}
                  className="text-brand-navy underline underline-offset-2"
                >
                  {d.file_name || "Document"}
                </Link>{" "}
                · {d.status}
              </li>
            ))}
            {recentDocs.length === 0 ? (
              <li className="font-sans text-sm text-neutral-600">No documents uploaded yet.</li>
            ) : null}
          </ul>
        </section>
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-md text-brand-navy">Assigned service providers</h3>
          <ul className="mt-4 flex flex-col gap-2 font-sans text-sm text-neutral-900">
            {t.assignments.length === 0 ? (
              <li className="text-neutral-600">
                No vendors assigned yet.{" "}
                <Link
                  href={`/tc/transactions/${params.id}/vendors`}
                  className="text-brand-navy underline underline-offset-2"
                >
                  Assign Vendors
                </Link>
              </li>
            ) : null}
            {t.assignments.map((assignment) => (
              <li key={assignment.id} className="rounded-brand-md border border-neutral-200 px-3 py-2">
                <p className="font-semibold text-brand-navy">
                  {assignment.contact?.fullName ?? "Removed contact"} ·{" "}
                  {transactionContactRoleLabel(assignment.assignmentRole)}
                </p>
                <p className="text-neutral-600">
                  {assignment.contact?.company || "No company"} ·{" "}
                  {assignment.contact?.email || assignment.contact?.phone || "No contact details"}
                </p>
                <p className="text-neutral-600">
                  Category context · {assignmentCategoryLabel(assignment.assignmentCategory)}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
          <h3 className="font-display text-heading-md text-brand-navy">Activity</h3>
          <div className="mt-4 flex flex-wrap gap-2 font-sans text-xs font-semibold">
            <span className="rounded-full bg-brand-gold-light px-2 py-1 text-brand-navy">
              AI pass
            </span>
            <span className="rounded-full bg-brand-navy px-2 py-1 text-white">
              Human pass
            </span>
          </div>
          <p className="mt-4 font-sans text-sm text-neutral-900">
            Created · {new Date(t.created_at).toLocaleDateString()}
          </p>
          <p className="mt-1 font-sans text-sm text-neutral-900">
            First pass · {t.first_pass_status || "Not started"}
          </p>
          <p className="mt-1 font-sans text-sm text-neutral-600">
            Automation reviews will be labeled as AI pass events. TC edits, document reviews,
            and coordinator decisions will be labeled as Human pass events.
          </p>
        </section>
      </div>
    </div>
  );
}
