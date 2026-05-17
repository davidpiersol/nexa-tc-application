export type PropertySuggestionField =
  | "property_address"
  | "county"
  | "parcel_number"
  | "owner_name"
  | "mailing_address"
  | "property_legal_description"
  | "acreage"
  | "assessed_value"
  | "tax_value"
  | "gis_link"
  | "transfer_history";

export type PropertyLookupSuggestion = {
  fieldKey: PropertySuggestionField;
  value: string;
  sourceKind: "manual_text" | "attom" | "county_registry";
  confidence: number;
  sourceNotes?: string;
};
