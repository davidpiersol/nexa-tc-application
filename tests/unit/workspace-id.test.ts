import { describe, expect, it } from "vitest";
import { isWorkspaceTransactionId } from "@/lib/utils/workspace-id";

describe("isWorkspaceTransactionId", () => {
  it("accepts lowercase RFC 4122 UUIDs", () => {
    expect(isWorkspaceTransactionId("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")).toBe(true);
  });

  it("accepts uppercase hex", () => {
    expect(isWorkspaceTransactionId("AAAAAAAA-AAAA-4AAA-8AAA-AAAAAAAAAAAA")).toBe(true);
  });

  it("rejects non-UUID strings", () => {
    expect(isWorkspaceTransactionId("profile")).toBe(false);
    expect(isWorkspaceTransactionId("tx-123")).toBe(false);
    expect(isWorkspaceTransactionId("")).toBe(false);
  });

  it("rejects wrong variant nibble", () => {
    expect(isWorkspaceTransactionId("aaaaaaaa-aaaa-4aaa-caaa-aaaaaaaaaaaa")).toBe(false);
  });
});
