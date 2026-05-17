export function documentStatusToBadge(
  status: string,
): { label: string; variant: "gold" | "navy" | "neutral" } {
  switch (status) {
    case "approved":
      return { label: "Approved", variant: "gold" };
    case "uploaded":
      return { label: "Uploaded", variant: "navy" };
    case "under_review":
      return { label: "Under review", variant: "neutral" };
    case "requested":
      return { label: "Requested", variant: "neutral" };
    case "rejected":
      return { label: "Rejected", variant: "neutral" };
    case "missing":
      return { label: "Missing", variant: "neutral" };
    case "sent_for_signature":
      return { label: "Sent for signature", variant: "neutral" };
    default:
      return { label: status, variant: "neutral" };
  }
}
