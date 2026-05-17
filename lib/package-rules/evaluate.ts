import type {
  DocumentPackageKind,
  DocumentPackageRuleItemRow,
  DocumentPackageRuleRow,
} from "@/lib/package-rules/types";

export type ResolvedTemplateRef = {
  kind: "global_template";
  templateId: string;
  sortOrder: number;
};

export type ResolvedUploadPlaceholder = {
  kind: "broker_upload" | "title_upload";
  label: string;
  sortOrder: number;
};

export type ResolvedPackageItem = ResolvedTemplateRef | ResolvedUploadPlaceholder;

/**
 * Deterministic ordering for checklist / completeness evaluation.
 */
export function evaluatePackageRule(rule: DocumentPackageRuleRow): ResolvedPackageItem[] {
  const items = rule.document_package_rule_items ?? [];
  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);
  const out: ResolvedPackageItem[] = [];
  for (const row of sorted) {
    const mapped = mapRuleItem(row);
    if (mapped) out.push(mapped);
  }
  return out;
}

function mapRuleItem(row: DocumentPackageRuleItemRow): ResolvedPackageItem | null {
  if (row.item_type === "global_template") {
    if (!row.global_document_template_id) return null;
    return {
      kind: "global_template",
      templateId: row.global_document_template_id,
      sortOrder: row.sort_order,
    };
  }
  if (row.item_type === "broker_upload" || row.item_type === "title_upload") {
    const label = row.placeholder_label?.trim();
    if (!label) return null;
    return {
      kind: row.item_type,
      label,
      sortOrder: row.sort_order,
    };
  }
  return null;
}

export function rulesMatchingKind(
  rules: DocumentPackageRuleRow[],
  kind: DocumentPackageKind,
): DocumentPackageRuleRow[] {
  return rules.filter((r) => r.package_kind === kind && r.is_active);
}
