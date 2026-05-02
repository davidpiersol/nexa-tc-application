import { DocumentCard } from "@/components/ui/document-card";
import { documentsPlaceholder } from "@/lib/data/screen-placeholders";

type Props = { params: { id: string } };

/**
 * Figma: **Document Manager/Default** → `/tc/transactions/[id]/documents`
 * TODO: category tree + upload + signed URLs.
 */
export default function TransactionDocumentsPage({ params }: Props) {
  const docs = documentsPlaceholder;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-sans text-sm text-neutral-600">
            Transaction · <span className="text-brand-navy">{params.id}</span>
          </p>
          <h2 className="font-display text-heading-lg text-brand-navy">Documents</h2>
        </div>
        {/* TODO: toolbar — upload, filter, sort */}
        <div className="font-sans text-sm text-neutral-600">Toolbar placeholder</div>
      </header>

      {/* TODO: sidebar category tree (collapsible) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {docs.map((d) => (
          <DocumentCard
            key={d.id}
            category={d.category}
            fileName={d.fileName}
            statusLabel={d.statusLabel}
            statusVariant={d.statusVariant}
            dateLabel={d.dateLabel}
          />
        ))}
      </div>
    </div>
  );
}
