/**
 * Claude extraction for a single document — returns parsed JSON or error wrapper.
 * Supports **text/* and application/pdf** via Anthropic document blocks.
 */
import Anthropic from "@anthropic-ai/sdk";
import { IntegrationConfigError } from "@/lib/integrations/errors";

import type { ExtractedShape } from "./merge";

const SYSTEM = `Real estate document parser. Extract structured data. Return ONLY valid JSON — no markdown — matching schema: { "parties", "property", "dates", "financial", "contingencies", "other" }. Use null for missing. Never invent data.`;

export type OkExtracted = { ok: true; data: ExtractedShape };
export type ErrExtracted = { ok: false; error: string };
export type ExtractResult = OkExtracted | ErrExtracted;

function parseModelJson(text: string): ExtractedShape {
  let raw = text.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return JSON.parse(raw) as ExtractedShape;
}

export async function extractDocumentWithClaude(params: {
  text: string;
  fileName: string;
}): Promise<ExtractResult> {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return { ok: false, error: "ANTHROPIC_API_KEY missing" };
  }

  const client = new Anthropic({ apiKey: key });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";

  const body = params.text.slice(0, 180_000);

  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 8192,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `File name: ${params.fileName}\n\n---\n\n${body}`,
        },
      ],
    });

    const block = msg.content[0];
    if (block.type !== "text") {
      return { ok: false, error: "unexpected_content_block" };
    }

    const data = parseModelJson(block.text);
    return { ok: true, data };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    return { ok: false, error: err };
  }
}

export async function extractDocumentWithClaudeFromBuffer(params: {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
}): Promise<ExtractResult> {
  const mt = params.mimeType.toLowerCase();
  if (mt === "application/pdf") {
    const key = process.env.ANTHROPIC_API_KEY?.trim();
    if (!key) {
      return { ok: false, error: "ANTHROPIC_API_KEY missing" };
    }
    const client = new Anthropic({ apiKey: key });
    const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-20241022";
    const b64 = params.buffer.toString("base64");
    try {
      const msg = await client.messages.create({
        model,
        max_tokens: 8192,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "document",
                source: {
                  type: "base64",
                  media_type: "application/pdf",
                  data: b64,
                },
                title: params.fileName,
              },
              {
                type: "text",
                text: "Parse the attached real-estate document per system instructions. Respond with JSON only.",
              },
            ],
          },
        ],
      });
      const block = msg.content[0];
      if (block.type !== "text") {
        return { ok: false, error: "unexpected_content_block" };
      }
      const data = parseModelJson(block.text);
      return { ok: true, data };
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      return { ok: false, error: err };
    }
  }

  if (mt.startsWith("text/") || mt === "application/json") {
    return extractDocumentWithClaude({
      text: params.buffer.toString("utf8"),
      fileName: params.fileName,
    });
  }

  return {
    ok: false,
    error: `unsupported_mime:${params.mimeType}`,
  };
}

export function __requireAnthropicOrThrow() {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new IntegrationConfigError("anthropic", "ANTHROPIC_API_KEY");
  }
}
