/** Kanban column ids — matches `TcPipelineKanban` / `TransactionCard` stage layout. */
export type PipelineColumnKey =
  | "listing"
  | "contract"
  | "pending"
  | "prelisting"
  | "closed";

/** Maps DB `transaction_status` ↔ kanban column. */
export function transactionStatusToColumn(
  status: string,
): PipelineColumnKey {
  switch (status) {
    case "draft":
      return "prelisting";
    case "active":
      return "listing";
    case "under_contract":
      return "contract";
    case "pending_close":
      return "pending";
    case "closed":
      return "closed";
    case "cancelled":
      return "prelisting";
    default:
      return "prelisting";
  }
}

export function columnToTransactionStatus(
  col: PipelineColumnKey,
):
  | "draft"
  | "active"
  | "under_contract"
  | "pending_close"
  | "closed" {
  switch (col) {
    case "prelisting":
      return "draft";
    case "listing":
      return "active";
    case "contract":
      return "under_contract";
    case "pending":
      return "pending_close";
    case "closed":
      return "closed";
    default:
      return "draft";
  }
}
