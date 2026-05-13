/** DocuSign envelope `documents[].fileExtension` from stored mime / filename (best-effort). */
export function envelopeFileExtension(params: {
  mimeType: string | null | undefined;
  fileName: string;
}): string {
  const m = (params.mimeType ?? "").toLowerCase();
  if (m.includes("pdf")) return "pdf";
  if (m.includes("png")) return "png";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.includes("msword")) return "doc";
  if (m.includes("wordprocessingml") || m.includes("officedocument")) return "docx";
  const tail = params.fileName.split(".").pop()?.toLowerCase();
  if (tail && /^[a-z0-9]{2,6}$/.test(tail)) return tail;
  return "pdf";
}
