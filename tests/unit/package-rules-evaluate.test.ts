import { describe, expect, it } from "vitest";
import {
  evaluatePackageRule,
  rulesMatchingKind,
} from "@/lib/package-rules/evaluate";
import type { DocumentPackageRuleRow } from "@/lib/package-rules/types";

describe("evaluatePackageRule", () => {
  it("orders items by sort_order and resolves templates vs placeholders", () => {
    const rule: DocumentPackageRuleRow = {
      id: "r1",
      tenant_id: null,
      package_kind: "seller",
      name: "Test",
      slug: "test",
      description: null,
      is_active: true,
      metadata: {},
      document_package_rule_items: [
        {
          id: "i2",
          rule_id: "r1",
          sort_order: 2,
          item_type: "broker_upload",
          global_document_template_id: null,
          placeholder_label: "Broker packet",
          metadata: {},
        },
        {
          id: "i1",
          rule_id: "r1",
          sort_order: 1,
          item_type: "global_template",
          global_document_template_id: "tmpl-1",
          placeholder_label: null,
          metadata: {},
        },
      ],
    };

    const resolved = evaluatePackageRule(rule);
    expect(resolved).toHaveLength(2);
    expect(resolved[0]).toMatchObject({
      kind: "global_template",
      templateId: "tmpl-1",
      sortOrder: 1,
    });
    expect(resolved[1]).toMatchObject({
      kind: "broker_upload",
      label: "Broker packet",
      sortOrder: 2,
    });
  });

  it("drops malformed rows", () => {
    const rule: DocumentPackageRuleRow = {
      id: "r1",
      tenant_id: null,
      package_kind: "title",
      name: "T",
      slug: "t",
      description: null,
      is_active: true,
      metadata: {},
      document_package_rule_items: [
        {
          id: "bad",
          rule_id: "r1",
          sort_order: 0,
          item_type: "global_template",
          global_document_template_id: null,
          placeholder_label: null,
          metadata: {},
        },
      ],
    };
    expect(evaluatePackageRule(rule)).toHaveLength(0);
  });
});

describe("rulesMatchingKind", () => {
  it("filters by kind and active flag", () => {
    const rows: DocumentPackageRuleRow[] = [
      {
        id: "a",
        tenant_id: null,
        package_kind: "seller",
        name: "S",
        slug: "s",
        description: null,
        is_active: true,
        metadata: {},
      },
      {
        id: "b",
        tenant_id: null,
        package_kind: "seller",
        name: "Off",
        slug: "off",
        description: null,
        is_active: false,
        metadata: {},
      },
      {
        id: "c",
        tenant_id: null,
        package_kind: "buyer",
        name: "B",
        slug: "b",
        description: null,
        is_active: true,
        metadata: {},
      },
    ];
    expect(rulesMatchingKind(rows, "seller")).toHaveLength(1);
    expect(rulesMatchingKind(rows, "seller")[0]?.id).toBe("a");
  });
});
