import JSZip from "jszip";

/** Max files in a downloadable packet (ZIP or signing bundle). */
export const MAX_PACKET_DOCUMENTS = 30;

/** Aggregate cap for raw file bytes before ZIP (50 MiB). */
export const MAX_PACKET_RAW_BYTES = 50 * 1024 * 1024;

/**
 * Deduplicate request order while preserving first-seen ordering.
 */
export function dedupeDocumentIds(documentIds: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of documentIds) {
    const t = id.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * Ensure unique entry names inside the ZIP (collision-safe for similar uploads).
 */
export function uniqueZipEntryNames(fileNames: string[]): string[] {
  const counts = new Map<string, number>();
  return fileNames.map((raw) => {
    const base = raw.replace(/[^\w.\-()\s]/g, "_").slice(0, 180) || "document.pdf";
    const n = (counts.get(base) ?? 0) + 1;
    counts.set(base, n);
    if (n === 1) return base;
    const dot = base.lastIndexOf(".");
    if (dot === -1) return `${base}_${n}`;
    return `${base.slice(0, dot)}_${n}${base.slice(dot)}`;
  });
}

export async function buildPacketZip(
  files: Array<{ name: string; data: Buffer }>,
): Promise<Buffer> {
  const zip = new JSZip();
  const names = uniqueZipEntryNames(files.map((f) => f.name));
  for (let i = 0; i < files.length; i++) {
    const row = files[i]!;
    zip.file(names[i]!, row.data);
  }
  const out = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  return Buffer.from(out);
}
