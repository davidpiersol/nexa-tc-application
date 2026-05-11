export type ArchiveView = "default" | "archive" | "all";

export function isArchivedTransaction(archivedAt: string | null | undefined): boolean {
  return Boolean(archivedAt && archivedAt.trim().length > 0);
}

export function matchesArchiveView(
  archivedAt: string | null | undefined,
  view: ArchiveView = "default",
): boolean {
  const archived = isArchivedTransaction(archivedAt);
  if (view === "archive") return archived;
  if (view === "all") return true;
  return !archived;
}
