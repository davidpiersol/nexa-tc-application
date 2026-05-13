export type DocumentPackageKind = "seller" | "buyer" | "title";

export type DocumentPackageRuleItemType = "global_template" | "broker_upload" | "title_upload";

export type DocumentPackageRuleItemRow = {
  id: string;
  rule_id: string;
  sort_order: number;
  item_type: DocumentPackageRuleItemType;
  global_document_template_id: string | null;
  placeholder_label: string | null;
  metadata: Record<string, unknown>;
};

export type DocumentPackageRuleRow = {
  id: string;
  tenant_id: string | null;
  package_kind: DocumentPackageKind;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  document_package_rule_items?: DocumentPackageRuleItemRow[];
};
