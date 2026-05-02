/**
 * Snapshot of [Figma Make](https://www.figma.com/make/XrH8hl5WJDXRz969sCTfoc/Untitled)
 * (`fileKey` XrH8hl5WJDXRz969sCTfoc). Published preview:
 * [figma.site](https://model-like-95584888.figma.site). Pulled via MCP resource URIs — edit when design updates.
 *
 * TODO: replace with API responses; keep structure aligned with Make when refreshing from Figma.
 */

import type {
  PipelineCard,
  PipelineColumnId,
} from "@/components/dashboard/tc-pipeline-kanban";

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** Matches Make `TCDashboard` stats row */
export const TC_STATS_FROM_MAKE = {
  activeTransactions: 47,
  dueThisWeek: 12,
  pendingReviews: 8,
  signaturesNeeded: 5,
} as const;

/** Kanban — maps Make statuses → `TransactionCard` `stage` */
export const tcPipelineFromMake: Record<PipelineColumnId, PipelineCard[]> = {
  prelisting: [
    {
      id: "make-pre-1",
      address: "456 Oak Ave",
      subtitle: "Berkeley, CA",
      closeDateLabel: "Close · Jun 15, 2026",
      tcInitials: initials("Sarah Lee"),
      progressPercent: 25,
      stage: "prelisting",
    },
    {
      id: "make-pre-2",
      address: "789 Pine St",
      subtitle: "Oakland, CA",
      closeDateLabel: "Close · Jun 20, 2026",
      tcInitials: initials("Mike Chen"),
      progressPercent: 15,
      stage: "prelisting",
    },
  ],
  listing: [
    {
      id: "make-list-1",
      address: "123 Main St",
      subtitle: "San Francisco, CA",
      closeDateLabel: "Close · May 30, 2026",
      tcInitials: initials("John Smith"),
      progressPercent: 45,
      stage: "listing",
    },
    {
      id: "make-list-2",
      address: "321 Elm St",
      subtitle: "San Jose, CA",
      closeDateLabel: "Close · Jun 5, 2026",
      tcInitials: initials("Emily Davis"),
      progressPercent: 60,
      stage: "listing",
    },
    {
      id: "make-list-3",
      address: "555 Broadway",
      subtitle: "San Francisco, CA",
      closeDateLabel: "Close · Jun 10, 2026",
      tcInitials: initials("Alex Kim"),
      progressPercent: 30,
      stage: "listing",
    },
  ],
  contract: [
    {
      id: "make-uc-1",
      address: "888 Market St",
      subtitle: "San Francisco, CA",
      closeDateLabel: "Close · May 25, 2026",
      tcInitials: initials("John Smith"),
      progressPercent: 75,
      stage: "contract",
    },
    {
      id: "make-uc-2",
      address: "222 Valencia St",
      subtitle: "San Francisco, CA",
      closeDateLabel: "Close · May 28, 2026",
      tcInitials: initials("Sarah Lee"),
      progressPercent: 80,
      stage: "contract",
    },
  ],
  pending: [
    {
      id: "make-pend-1",
      address: "999 Mission St",
      subtitle: "San Francisco, CA",
      closeDateLabel: "Close · May 22, 2026",
      tcInitials: initials("Mike Chen"),
      progressPercent: 90,
      stage: "pending",
    },
  ],
  closed: [
    {
      id: "make-cl-1",
      address: "111 Howard St",
      subtitle: "San Francisco, CA",
      closeDateLabel: "Closed · May 15, 2026",
      tcInitials: initials("Emily Davis"),
      progressPercent: 100,
      stage: "closed",
    },
    {
      id: "make-cl-2",
      address: "333 Folsom St",
      subtitle: "San Francisco, CA",
      closeDateLabel: "Closed · May 18, 2026",
      tcInitials: initials("Alex Kim"),
      progressPercent: 100,
      stage: "closed",
    },
  ],
};

export type TcDeadlineFromMake = {
  id: string;
  address: string;
  type: string;
  date: string;
  priority: "high" | "medium" | "low";
};

export const tcDeadlinesFromMake: TcDeadlineFromMake[] = [
  { id: "d1", address: "888 Market St", type: "Inspection Due", date: "May 8, 2026", priority: "high" },
  { id: "d2", address: "222 Valencia St", type: "Loan Approval", date: "May 10, 2026", priority: "high" },
  { id: "d3", address: "123 Main St", type: "Disclosure Review", date: "May 12, 2026", priority: "medium" },
  { id: "d4", address: "321 Elm St", type: "Title Search", date: "May 20, 2026", priority: "medium" },
  { id: "d5", address: "456 Oak Ave", type: "Listing Photos", date: "Jun 1, 2026", priority: "low" },
];

export type TcTaskFromMake = {
  id: string;
  name: string;
  priority: "high" | "medium" | "low";
  completed: boolean;
};

export const tcTasksFromMake: TcTaskFromMake[] = [
  { id: "t1", name: "Review inspection report for 888 Market", priority: "high", completed: false },
  { id: "t2", name: "Schedule closing for 999 Mission", priority: "high", completed: false },
  { id: "t3", name: "Upload disclosures for 123 Main", priority: "medium", completed: false },
  { id: "t4", name: "Follow up with lender on 222 Valencia", priority: "medium", completed: false },
  { id: "t5", name: "Update listing photos for 321 Elm", priority: "low", completed: true },
  { id: "t6", name: "Send welcome packet to new clients", priority: "low", completed: false },
];

/** Buyer dashboard — matches Make `BuyerDashboard` */
export const buyerTimelineFromMake = [
  { label: "Offer Accepted", completed: true, active: false },
  { label: "Inspection Complete", completed: true, active: false },
  { label: "Loan Approved", completed: false, active: true },
  { label: "Final Walkthrough", completed: false, active: false },
  { label: "Closing Day", completed: false, active: false },
] as const;

export type BuyerDocFromMake = {
  category: "contract" | "disclosure" | "inspection" | "loan" | "title" | "photos";
  filename: string;
  status: "pending" | "approved" | "rejected";
  date: string;
};

export const buyerDocumentsFromMake: BuyerDocFromMake[] = [
  { category: "contract", filename: "Purchase Agreement.pdf", status: "approved", date: "Apr 15, 2026" },
  { category: "disclosure", filename: "Seller Disclosures.pdf", status: "approved", date: "Apr 18, 2026" },
  { category: "inspection", filename: "Home Inspection Report.pdf", status: "approved", date: "Apr 25, 2026" },
  { category: "loan", filename: "Loan Estimate.pdf", status: "pending", date: "May 1, 2026" },
  { category: "title", filename: "Title Report.pdf", status: "pending", date: "May 2, 2026" },
  { category: "photos", filename: "Property Photos.zip", status: "approved", date: "Apr 20, 2026" },
];

export const buyerImportantDatesFromMake = [
  { month: "MAY", day: "15", event: "Inspection" },
  { month: "MAY", day: "22", event: "Loan Approval" },
  { month: "MAY", day: "30", event: "Closing Day" },
] as const;
