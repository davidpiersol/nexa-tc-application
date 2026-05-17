export const CRM_TASK_KINDS = ["follow_up", "reminder"] as const;
export const CRM_TASK_PRIORITIES = ["low", "medium", "high"] as const;
export const CRM_TASK_STATUSES = ["open", "completed", "archived"] as const;
export const CRM_SEGMENTS = [
  "soi",
  "hot",
  "warm",
  "cold",
  "vendor",
  "broker_client",
  "prospect",
  "other",
] as const;
export const CRM_TOUCH_TYPES = ["note", "call", "email", "text", "meeting", "task", "import"] as const;
export const CRM_TOUCH_DIRECTIONS = ["inbound", "outbound", "internal"] as const;
export const CRM_RELATIONSHIP_TYPES = [
  "referral_source",
  "client",
  "vendor",
  "broker",
  "family",
  "business",
  "other",
] as const;

export type CrmTaskKind = (typeof CRM_TASK_KINDS)[number];
export type CrmTaskStatus = (typeof CRM_TASK_STATUSES)[number];
export type CrmActionBucketKey =
  | "overdue"
  | "today"
  | "this_week"
  | "this_month"
  | "this_quarter"
  | "later"
  | "completed";

export type CrmActionLike = {
  id: string;
  title: string;
  dueAt: string | null;
  status: CrmTaskStatus;
};

export type CrmActionBuckets<T extends CrmActionLike> = Record<CrmActionBucketKey, T[]>;

export const CRM_ACTION_BUCKET_LABELS: Record<CrmActionBucketKey, string> = {
  overdue: "Overdue",
  today: "Today",
  this_week: "This week",
  this_month: "This month",
  this_quarter: "This quarter",
  later: "Later",
  completed: "Completed",
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function endOfWeek(date: Date): Date {
  const day = date.getDay();
  const daysUntilSunday = 6 - day;
  return endOfDay(new Date(date.getFullYear(), date.getMonth(), date.getDate() + daysUntilSunday));
}

function endOfMonth(date: Date): Date {
  return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

function endOfQuarter(date: Date): Date {
  const quarterEndMonth = Math.floor(date.getMonth() / 3) * 3 + 2;
  return endOfDay(new Date(date.getFullYear(), quarterEndMonth + 1, 0));
}

export function emptyCrmActionBuckets<T extends CrmActionLike>(): CrmActionBuckets<T> {
  return {
    overdue: [],
    today: [],
    this_week: [],
    this_month: [],
    this_quarter: [],
    later: [],
    completed: [],
  };
}

export function bucketCrmActions<T extends CrmActionLike>(
  actions: T[],
  now = new Date(),
): CrmActionBuckets<T> {
  const buckets = emptyCrmActionBuckets<T>();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfWeek(now);
  const monthEnd = endOfMonth(now);
  const quarterEnd = endOfQuarter(now);

  for (const action of actions) {
    if (action.status === "completed" || action.status === "archived") {
      buckets.completed.push(action);
      continue;
    }
    if (!action.dueAt) {
      buckets.later.push(action);
      continue;
    }
    const due = new Date(action.dueAt);
    if (Number.isNaN(due.getTime())) {
      buckets.later.push(action);
    } else if (due < todayStart) {
      buckets.overdue.push(action);
    } else if (due <= todayEnd) {
      buckets.today.push(action);
    } else if (due <= weekEnd) {
      buckets.this_week.push(action);
    } else if (due <= monthEnd) {
      buckets.this_month.push(action);
    } else if (due <= quarterEnd) {
      buckets.this_quarter.push(action);
    } else {
      buckets.later.push(action);
    }
  }

  return buckets;
}

export function crmStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function crmDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
