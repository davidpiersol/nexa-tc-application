export type ScorecardMetricCadence = "daily" | "weekly";

export type ScorecardMetric = {
  id: string;
  label: string;
  cadence: ScorecardMetricCadence;
  target: number;
  completed: number;
  unit: string;
};

export type ScorecardSummary = {
  configured: boolean;
  completed: number;
  total: number;
  percent: number;
  metrics: ScorecardMetric[];
  blocker: string;
};

export const SCORECARD_PLACEHOLDER_BLOCKER =
  "Coldwell Banker/team scorecard task definitions have not been supplied yet.";

export const PLACEHOLDER_SCORECARD_METRICS: ScorecardMetric[] = [
  {
    id: "soi-notes",
    label: "SOI notes",
    cadence: "daily",
    target: 200,
    completed: 0,
    unit: "notes",
  },
  {
    id: "broker-outreach",
    label: "Broker outreach",
    cadence: "daily",
    target: 5,
    completed: 0,
    unit: "touches",
  },
  {
    id: "follow-up-review",
    label: "Follow-up review",
    cadence: "daily",
    target: 1,
    completed: 0,
    unit: "review",
  },
  {
    id: "pipeline-check",
    label: "Pipeline check",
    cadence: "daily",
    target: 1,
    completed: 0,
    unit: "check",
  },
  {
    id: "weekly-growth-review",
    label: "Weekly growth review",
    cadence: "weekly",
    target: 1,
    completed: 0,
    unit: "review",
  },
];

export function buildScorecardPlaceholder(
  metrics: ScorecardMetric[] = PLACEHOLDER_SCORECARD_METRICS,
): ScorecardSummary {
  const total = metrics.reduce((sum, metric) => sum + metric.target, 0);
  const completed = metrics.reduce(
    (sum, metric) => sum + Math.min(metric.completed, metric.target),
    0,
  );

  return {
    configured: false,
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    metrics,
    blocker: SCORECARD_PLACEHOLDER_BLOCKER,
  };
}
