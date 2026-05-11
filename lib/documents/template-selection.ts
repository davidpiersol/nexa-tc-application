export const TEMPLATE_SELECTION_STATES = [
  "required",
  "optional",
  "default",
  "unavailable",
  "pending_licensed_copy",
] as const;

export type TemplateSelectionState = (typeof TEMPLATE_SELECTION_STATES)[number];

export const TEMPLATE_AVAILABILITY_STATES = [
  "available",
  "unavailable",
  "pending_licensed_copy",
] as const;

export type TemplateAvailabilityState =
  (typeof TEMPLATE_AVAILABILITY_STATES)[number];

export function isTemplateSelectionState(
  value: string | null | undefined,
): value is TemplateSelectionState {
  return (
    typeof value === "string" &&
    (TEMPLATE_SELECTION_STATES as readonly string[]).includes(value)
  );
}

export function isTemplateAvailabilityState(
  value: string | null | undefined,
): value is TemplateAvailabilityState {
  return (
    typeof value === "string" &&
    (TEMPLATE_AVAILABILITY_STATES as readonly string[]).includes(value)
  );
}

export function templateSelectionStateLabel(
  value: string | null | undefined,
): string {
  if (!value) return "Optional";
  switch (value) {
    case "required":
      return "Required";
    case "optional":
      return "Optional";
    case "default":
      return "Default";
    case "unavailable":
      return "Unavailable";
    case "pending_licensed_copy":
      return "Pending licensed copy";
    default:
      return value;
  }
}

export function templateAvailabilityLabel(
  value: string | null | undefined,
): string {
  if (!value) return "Available";
  switch (value) {
    case "available":
      return "Available";
    case "unavailable":
      return "Unavailable";
    case "pending_licensed_copy":
      return "Pending licensed copy";
    default:
      return value;
  }
}
