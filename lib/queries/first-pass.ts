import { createClient } from "@/lib/supabase/server";

export async function getFirstPassBundle(transactionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("first_pass_data, first_pass_scores, first_pass_status, property_address")
    .eq("id", transactionId)
    .maybeSingle();

  if (error || !data) return null;

  const scores = data.first_pass_scores as Record<string, unknown> | null;
  const overall =
    typeof scores?.overall === "number"
      ? scores.overall
      : typeof scores?.confidence === "number"
        ? scores.confidence
        : null;

  const fpData = data.first_pass_data as Record<string, unknown> | null;
  const summary =
    typeof fpData?.summary === "string"
      ? fpData.summary
      : "AI First Pass will populate this section after MLS and documents are processed.";

  return {
    confidence: overall ?? 0,
    summary,
    firstPassStatus: data.first_pass_status as string | null,
    propertyAddress: data.property_address,
  };
}
