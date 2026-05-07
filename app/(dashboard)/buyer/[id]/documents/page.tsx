import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentIcons } from "@/components/graphics/DocumentIcons";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/ui/document-card";
import { getTransactionDetail, listDocumentsForTransaction } from "@/lib/queries/transaction-detail";

type Props = {
  params: { id: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const CATEGORY_LABEL: Record<string, string> = {
  contract: "Contract",
  disclosure: "Disclosure",
  inspection: "Inspection",
  mortgage: "Loan",
  title: "Title",
  hoa: "HOA",
  other: "Other",
};

function statusVariant(
  status: string,
): React.ComponentProps<typeof DocumentCard>["statusVariant"] {
  if (status === "approved" || status === "uploaded") return "success";
  if (status === "under_review" || status === "requested") return "warning";
  if (status === "rejected" || status === "missing") return "danger";
  return "neutral";
}

function iconForCategory(category: string) {
  if (category === "disclosure") return DocumentIcons.disclosure;
  if (category === "inspection") return DocumentIcons.inspection;
  if (category === "mortgage") return DocumentIcons.loan;
  if (category === "title") return DocumentIcons.title;
  if (category === "contract") return DocumentIcons.contract;
  return DocumentIcons.photos;
}

export default async function BuyerDocumentsPage({ params, searchParams }: Props) {
  const transaction = await getTransactionDetail(params.id);
  if (!transaction) notFound();

  const docs = await listDocumentsForTransaction(params.id);
  const rawCategory = Array.isArray(searchParams?.category)
    ? searchParams?.category[0]
    : searchParams?.category;
  const categoryFilter = typeof rawCategory === "string" ? rawCategory : undefined;

  const filtered = categoryFilter
    ? docs.filter((d) => String(d.category) === categoryFilter)
    : docs;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 border-b border-neutral-300 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-heading-lg text-brand-navy">Buyer documents</h2>
          <p className="mt-1 font-sans text-ui-body text-neutral-600">
            {transaction.property_address?.trim() || "Transaction"}{" "}
            {categoryFilter ? `· ${CATEGORY_LABEL[categoryFilter] ?? categoryFilter}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {categoryFilter ? (
            <Button variant="secondary" type="button" asChild>
              <Link href={`/buyer/${params.id}/documents`}>All docs</Link>
            </Button>
          ) : null}
          <Button variant="secondary" type="button" asChild>
            <Link href={`/buyer/${params.id}`}>Back to dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {filtered.length === 0 ? (
          <p className="rounded-brand-md border border-neutral-300 bg-white px-4 py-3 font-sans text-sm text-neutral-600">
            No documents available in this view yet.
          </p>
        ) : null}
        {filtered.map((doc) => {
          const Icon = iconForCategory(String(doc.category));
          return (
            <DocumentCard
              key={doc.id}
              category={CATEGORY_LABEL[String(doc.category)] ?? String(doc.category)}
              fileName={doc.file_name || "Document"}
              statusVariant={statusVariant(String(doc.status))}
              statusLabel={String(doc.status).replace(/_/g, " ")}
              dateLabel={String(doc.updated_at ?? doc.created_at ?? "").slice(0, 10) || "—"}
              thumbnail={<Icon size={56} />}
            />
          );
        })}
      </div>
    </div>
  );
}
