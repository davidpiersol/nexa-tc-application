export function uatIssuesEnabled(): boolean {
  return process.env.UAT_ISSUES_ENABLED === "true";
}
