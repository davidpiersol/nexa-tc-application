/** UUID shape used for `/agent/[id]` (and other party scoped workspace ids). */
const WORKSPACE_TX_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isWorkspaceTransactionId(value: string): boolean {
  return WORKSPACE_TX_ID.test(value);
}
