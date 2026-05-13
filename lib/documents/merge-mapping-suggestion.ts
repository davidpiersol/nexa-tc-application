/**
 * When approving an AI suggestion, admins may optionally edit mappings before apply.
 */
export function mergeApprovedSuggestionMappings(
  suggestionMappings: Record<string, string>,
  editedMappings?: Record<string, string>,
): Record<string, string> {
  if (editedMappings !== undefined) {
    return { ...editedMappings };
  }
  return { ...suggestionMappings };
}
