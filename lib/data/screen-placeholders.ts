/**
 * Placeholder domain data for Figma-aligned screens.
 * TODO: replace every export with Supabase / API queries (see inline TODOs per screen).
 */

import type {
  PipelineCard,
  PipelineColumnId,
} from "@/components/dashboard/tc-pipeline-kanban";

/** TC Dashboard — KPI row */
export const TC_STATS_PLACEHOLDER = {
  // TODO: GET /api/dashboard/tc/stats
  activeTransactions: 14,
  dueThisWeek: 6,
  pendingReviews: 3,
  signaturesNeeded: 2,
} as const;

/** Kanban pipeline — initial columns */
export function tcPipelinePlaceholder(): Record<PipelineColumnId, PipelineCard[]> {
  // TODO: GET /api/transactions?group_by=pipeline_stage
  return {
    listing: [
      {
        id: "txn_list_1",
        address: "4821 Maple Ridge Dr, Austin",
        closeDateLabel: "Close · Jun 14",
        tcInitials: "JP",
        progressPercent: 35,
        stage: "listing",
      },
    ],
    contract: [
      {
        id: "txn_uc_1",
        address: "910 Pearl St, Boulder",
        closeDateLabel: "Close · May 28",
        tcInitials: "AK",
        progressPercent: 72,
        stage: "contract",
      },
    ],
    pending: [
      {
        id: "txn_pend_1",
        address: "224 Ocean Ave, Newport",
        closeDateLabel: "Close · Jul 02",
        tcInitials: "JP",
        progressPercent: 48,
        stage: "pending",
      },
    ],
    prelisting: [
      {
        id: "txn_pre_1",
        address: "14 Cedar Ln, Portland",
        closeDateLabel: "Listing · Apr 30",
        tcInitials: "LM",
        progressPercent: 15,
        stage: "prelisting",
      },
    ],
    closed: [
      {
        id: "txn_closed_1",
        address: "600 Union Sq, Denver",
        closeDateLabel: "Closed · Mar 12",
        tcInitials: "AK",
        progressPercent: 100,
        stage: "closed",
      },
    ],
  };
}

/** Transaction detail shell */
export const transactionDetailPlaceholder = (id: string) =>
  ({
    // TODO: GET /api/transactions/:id
    id,
    address: "4821 Maple Ridge Dr, Austin, TX 78731",
    parties: ["Buyer · Jordan Lee", "Seller · Morgan Ellis", "Listing · Beacon Realty"],
    milestone: "Inspection contingency",
  }) as const;

/** First Pass */
export const firstPassPlaceholder = {
  // TODO: GET /api/transactions/:id/first-pass
  confidence: 87,
  summary:
    "Contract dates align with addenda; earnest money receipt attached; HOA docs pending.",
  checklist: [
    { id: "fp1", label: "Purchase agreement executed", checked: true },
    { id: "fp2", label: "Seller disclosures uploaded", checked: true },
    { id: "fp3", label: "HOA resale package", checked: false },
    { id: "fp4", label: "Loan estimate acknowledged", checked: false },
  ],
};

/** Documents grid */
export const documentsPlaceholder = [
  // TODO: GET /api/transactions/:id/documents
  {
    id: "d1",
    category: "Contract",
    fileName: "Purchase_Agreement.pdf",
    statusLabel: "Signed",
    statusVariant: "success" as const,
    dateLabel: "Apr 02",
  },
  {
    id: "d2",
    category: "Disclosure",
    fileName: "Seller_Disclosure.pdf",
    statusLabel: "Review",
    statusVariant: "warning" as const,
    dateLabel: "Apr 04",
  },
  {
    id: "d3",
    category: "Title",
    fileName: "Preliminary_Report.pdf",
    statusLabel: "Received",
    statusVariant: "neutral" as const,
    dateLabel: "Apr 06",
  },
];

/** Buyer progress timeline */
export const buyerTimelinePlaceholder = [
  // TODO: GET transaction milestones for buyer scope
  { id: "s1", label: "Offer accepted", state: "complete" as const },
  { id: "s2", label: "Inspection", state: "complete" as const },
  { id: "s3", label: "Appraisal", state: "active" as const },
  { id: "s4", label: "Clear to close", state: "future" as const },
  { id: "s5", label: "Closing", state: "future" as const },
];
