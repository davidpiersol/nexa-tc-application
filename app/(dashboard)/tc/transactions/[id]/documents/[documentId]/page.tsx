import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentAdminActions } from "@/components/tc/document-admin-actions";
import { DocumentDownloadButton } from "@/components/tc/document-download-button";
import { Button } from "@/components/ui/button";
import {
  getTransactionDetail,
  getTransactionDocumentDetail,
} from "@/lib/queries/transaction-detail";

type Props = {
  params: {
    id: string;
    documentId: string;
  };
};

export default async function TransactionDocumentDetailPage({ params }: Props) {
  const [tx, document] = await Promise.all([
    getTransactionDetail(params.id),
    getTransactionDocumentDetail(params.id, params.documentId),
  ]);

  if (!tx || !document) notFound();

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-neutral-300 pb-5">
        <p className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">
          Transaction · {tx.mls_number ? `MLS #${tx.mls_number}` : tx.id}
        </p>
        <h2 className="mt-2 font-display text-heading-lg text-brand-navy">Document details</h2>
        <p className="mt-2 font-sans text-ui-body text-neutral-600">
          {document.file_name ?? "Document"} · {String(document.category)}
        </p>
      </header>

      <section className="rounded-brand-lg border border-neutral-300 bg-white p-5 shadow-brand-sm">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">File name</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">
              {document.file_name ?? "Not set"}
            </dd>
          </div>

          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Status</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">
              {String(document.status).replace(/_/g, " ")}
            </dd>
          </div>

          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Category</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">{String(document.category)}</dd>
          </div>

          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">MIME type</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">{document.mime_type ?? "Unknown"}</dd>
          </div>

          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Visible to client</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">
              {document.visible_to_client ? "Yes" : "No"}
            </dd>
          </div>

          <div>
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Last updated</dt>
            <dd className="mt-1 font-sans text-ui-body text-neutral-900">
              {new Date(document.updated_at).toLocaleString()}
            </dd>
          </div>

          <div className="sm:col-span-2">
            <dt className="font-sans text-ui-label uppercase tracking-wide text-neutral-600">Document ID</dt>
            <dd className="mt-1 break-all font-mono text-sm text-neutral-900">{document.id}</dd>
          </div>
        </dl>
      </section>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <DocumentDownloadButton documentId={document.id} label="Download document" />
          <Button variant="secondary" type="button" asChild>
            <Link href={`/tc/transactions/${params.id}/documents`}>Back to documents</Link>
          </Button>
          <Button variant="ghost" type="button" asChild>
            <Link href={`/tc/transactions/${params.id}`}>Back to transaction detail</Link>
          </Button>
        </div>

        <DocumentAdminActions
          documentId={document.id}
          backTo={`/tc/transactions/${params.id}/documents`}
        />
      </div>
    </div>
  );
}
