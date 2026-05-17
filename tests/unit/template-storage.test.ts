import { describe, expect, it } from "vitest";
import {
  buildGlobalTemplateStoragePath,
  isExpectedGlobalTemplateVersionPath,
  parseGlobalTemplateStoragePath,
  sanitizeTemplateFileName,
} from "@/lib/documents/template-storage";

describe("template storage helpers", () => {
  it("sanitizes filenames and enforces .pdf extension", () => {
    expect(sanitizeTemplateFileName("NMAR 2104 (rev#1).pdf")).toBe(
      "NMAR_2104_rev_1_.pdf",
    );
    expect(sanitizeTemplateFileName("unsafe name")).toBe("unsafe_name.pdf");
  });

  it("builds global template storage path format", () => {
    const path = buildGlobalTemplateStoragePath({
      templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      versionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      sourceFileName: "NMAR 2104.pdf",
    });
    expect(path).toBe(
      "templates/global/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/NMAR_2104.pdf",
    );
  });

  it("parses global template paths and rejects invalid shapes", () => {
    expect(
      parseGlobalTemplateStoragePath(
        "templates/global/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/NMAR_2104.pdf",
      ),
    ).toEqual({
      templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      versionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    expect(parseGlobalTemplateStoragePath("templates/evil/../../../etc/passwd")).toBe(null);
    expect(parseGlobalTemplateStoragePath("attachments/foo.pdf")).toBe(null);
  });

  it("matches template/version ids against path", () => {
    expect(
      isExpectedGlobalTemplateVersionPath({
        storagePath:
          "templates/global/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/x.pdf",
        templateId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        versionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      }),
    ).toBe(true);

    expect(
      isExpectedGlobalTemplateVersionPath({
        storagePath:
          "templates/global/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/x.pdf",
        templateId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
        versionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      }),
    ).toBe(false);
  });
});
