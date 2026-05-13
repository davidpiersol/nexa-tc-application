import Anthropic from "@anthropic-ai/sdk";
import {
  CANONICAL_FIELD_PICKER_OPTIONS,
  validateTemplateFieldMappings,
} from "@/lib/documents/template-field-mapping";

export type AiMappingSuggestionModelResult =
  | {
      ok: true;
      mappings: Record<string, string>;
      confidence: number | null;
      rationale: string | null;
      modelName: string;
      rawTextPreview: string;
    }
  | { ok: false; error: string };

const SYSTEM = `You map PDF AcroForm field names to canonical transaction field keys for a real-estate TC application.

Rules:
- Respond with ONLY valid JSON (no markdown fences).
- Shape: { "mappings": { "<pdf_field_name>": "<canonical_key>", ... }, "confidence": <0-1 number or null>, "rationale": "<short optional note>" }
- Only use canonical keys from the provided list. Omit PDF fields you cannot map confidently.
- Never invent canonical keys. Prefer leaving a PDF field unmapped over guessing.
- Each canonical key may appear at most once in mappings (one PDF field per canonical target).`;

function parseJsonResponse(text: string): unknown {
  let raw = text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return JSON.parse(raw) as unknown;
}

export function parseAiMappingPayload(raw: unknown): {
  mappings: Record<string, unknown>;
  confidence: number | null;
  rationale: string | null;
} | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const mappings = obj.mappings;
  if (!mappings || typeof mappings !== "object" || Array.isArray(mappings)) return null;
  let confidence: number | null = null;
  if (typeof obj.confidence === "number" && Number.isFinite(obj.confidence)) {
    confidence = Math.min(1, Math.max(0, obj.confidence));
  }
  const rationale =
    typeof obj.rationale === "string" && obj.rationale.trim()
      ? obj.rationale.trim().slice(0, 2000)
      : null;
  return { mappings: mappings as Record<string, unknown>, confidence, rationale };
}

export async function requestAiFieldMappings(params: {
  pdfFieldNames: string[];
}): Promise<AiMappingSuggestionModelResult> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "ANTHROPIC_API_KEY missing" };
  }

  const modelName =
    process.env.NEXA_AI_MAPPING_MODEL?.trim() ||
    process.env.ANTHROPIC_MODEL?.trim() ||
    "claude-3-5-haiku-20241022";

  const canonicalList = CANONICAL_FIELD_PICKER_OPTIONS.map((o) => o.key).join("\n");

  const userPayload = [
    `PDF field names (${params.pdfFieldNames.length}):`,
    params.pdfFieldNames.join(", ") || "(none)",
    "",
    "Canonical keys (use these exact strings):",
    canonicalList,
  ].join("\n");

  const client = new Anthropic({ apiKey: key });

  try {
    const msg = await client.messages.create({
      model: modelName,
      max_tokens: 4096,
      system: SYSTEM,
      messages: [{ role: "user", content: userPayload }],
    });

    const block = msg.content[0];
    if (block.type !== "text") {
      return { ok: false, error: "unexpected_content_block" };
    }

    const rawTextPreview = block.text.trim().slice(0, 8000);
    let parsed: unknown;
    try {
      parsed = parseJsonResponse(block.text);
    } catch {
      return { ok: false, error: "model_returned_invalid_json" };
    }

    const payload = parseAiMappingPayload(parsed);
    if (!payload) {
      return { ok: false, error: "model_payload_invalid_shape" };
    }

    const stringMappings: Record<string, string> = {};
    for (const [k, v] of Object.entries(payload.mappings)) {
      if (typeof v === "string" && v.trim()) {
        stringMappings[k.trim()] = v.trim();
      }
    }

    const validated = validateTemplateFieldMappings(stringMappings, params.pdfFieldNames);
    if (validated.errors.length) {
      return {
        ok: false,
        error: `mapping_validation_error:${validated.errors.slice(0, 5).join(";")}`,
      };
    }

    return {
      ok: true,
      mappings: validated.normalized,
      confidence: payload.confidence,
      rationale: payload.rationale,
      modelName,
      rawTextPreview,
    };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, error: err };
  }
}
