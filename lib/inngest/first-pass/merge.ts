/**
 * Merge MLS / ATTOM blobs + per-document Claude extractions into unified first-pass shape + scores.
 * Scoring (per section): 100 = 2+ sources agree, 85 = single MLS/ATTOM-quality source,
 * 70 = single document extraction, 50 = multiple sources without agreement, 0 = empty.
 */

export type FirstPassShape = {
  parties: unknown;
  property: unknown;
  dates: unknown;
  financial: unknown;
  contingencies: unknown;
  other: unknown;
};

/** Claude JSON extraction shape (partial keys allowed). */
export type ExtractedShape = Partial<FirstPassShape>;

export type FirstPassScores = {
  sections: Record<keyof FirstPassShape, number>;
  /** Average of non-zero section scores, for notifications */
  overallPercent: number;
};

const SECTIONS: (keyof FirstPassShape)[] = [
  "parties",
  "property",
  "dates",
  "financial",
  "contingencies",
  "other",
];

function stableStringify(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return JSON.stringify(v.map((x) => JSON.parse(stableStringify(x))));
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o).sort();
  const sorted: Record<string, unknown> = {};
  for (const k of keys) sorted[k] = o[k];
  return JSON.stringify(sorted);
}

function isNonEmpty(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  if (typeof v === "object" && !Array.isArray(v)) return Object.keys(v as object).length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

/** Pick section value from Claude-shaped extraction. */
function sectionFromDoc(doc: ExtractedShape, key: keyof FirstPassShape): unknown {
  return doc[key];
}

/**
 * Build unified first_pass_data and scores from stored property_data + doc extractions.
 */
export function mergeAndScore(args: {
  propertyData: Record<string, unknown>;
  docExtractions: ExtractedShape[];
}): { first_pass_data: FirstPassShape; scores: FirstPassScores } {
  const mls = args.propertyData.mls;
  const attom = args.propertyData.attom;

  const first_pass_data: FirstPassShape = {
    parties: null,
    property: null,
    dates: null,
    financial: null,
    contingencies: null,
    other: null,
  };

  const sections: Record<keyof FirstPassShape, number> = {
    parties: 0,
    property: 0,
    dates: 0,
    financial: 0,
    contingencies: 0,
    other: 0,
  };

  for (const key of SECTIONS) {
    const fromDocs = args.docExtractions
      .map((d) => sectionFromDoc(d, key))
      .filter(isNonEmpty);

    const fromMls = key === "property" && isNonEmpty(mls) ? mls : undefined;
    const fromAttom =
      key === "property" && isNonEmpty(attom) ? attom : undefined;

    const candidates: { value: unknown; source: "mls" | "attom" | "doc" }[] = [];
    if (fromMls !== undefined) candidates.push({ value: fromMls, source: "mls" });
    if (fromAttom !== undefined) candidates.push({ value: fromAttom, source: "attom" });
    for (const v of fromDocs) {
      candidates.push({ value: v, source: "doc" });
    }

    if (candidates.length === 0) {
      first_pass_data[key] = null;
      sections[key] = 0;
      continue;
    }

    if (candidates.length >= 2) {
      const sigs = candidates.map((c) => stableStringify(c.value));
      const first = sigs[0];
      const allMatch = sigs.every((s) => s === first && first !== "");
      if (allMatch && first !== "") {
        first_pass_data[key] = candidates[0].value;
        sections[key] = 100;
        continue;
      }
      /** disagreeing multi-source */
      first_pass_data[key] =
        key === "property"
          ? { mls, attom, documents: fromDocs.length ? fromDocs : undefined }
          : fromDocs[0] ?? candidates[0].value;
      sections[key] = 50;
      continue;
    }

    const only = candidates[0];
    first_pass_data[key] = only.value;
    if (only.source === "mls" || only.source === "attom") sections[key] = 85;
    else sections[key] = 70;
  }

  const nonzero = SECTIONS.map((k) => sections[k]).filter((s) => s > 0);
  const overallPercent =
    nonzero.length === 0
      ? 0
      : Math.round(nonzero.reduce((a, b) => a + b, 0) / nonzero.length);

  return {
    first_pass_data,
    scores: { sections, overallPercent },
  };
}
