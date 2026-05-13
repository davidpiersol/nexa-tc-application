import { describe, expect, it } from "vitest";
import { envelopeFileExtension } from "@/lib/signing/envelope-file-extension";

describe("envelopeFileExtension", () => {
  it("uses mime type when present", () => {
    expect(
      envelopeFileExtension({
        mimeType: "application/pdf",
        fileName: "ignored.txt",
      }),
    ).toBe("pdf");
    expect(envelopeFileExtension({ mimeType: "image/png", fileName: "x" })).toBe("png");
  });

  it("falls back to filename extension when mime ambiguous", () => {
    expect(
      envelopeFileExtension({
        mimeType: "",
        fileName: "report.docx",
      }),
    ).toBe("docx");
  });

  it("defaults to pdf when unknown", () => {
    expect(
      envelopeFileExtension({
        mimeType: "",
        fileName: "nofile-extension",
      }),
    ).toBe("pdf");
  });
});
