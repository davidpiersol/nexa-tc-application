import { beforeEach, describe, expect, it, vi } from "vitest";

const insertApiAudit = vi.fn(async () => undefined);
const fillPdfFromMappedFields = vi.fn(async () => new Uint8Array([37, 80, 68, 70]));
const upload = vi.fn(async () => ({ error: null }));
const download = vi.fn(async () => ({
  data: new Blob([new Uint8Array([1, 2, 3])], { type: "application/pdf" }),
  error: null,
}));
const documentsInsert = vi.fn();

vi.mock("@/lib/audit/route-audit", () => ({
  insertApiAudit,
}));

vi.mock("@/lib/auth/actor-context", () => ({
  loadActorContext: vi.fn(async () => ({
    userId: "00000000-0000-4000-8000-000000000001",
    tenantId: "00000000-0000-4000-8000-000000000002",
    role: "tc",
  })),
}));

vi.mock("@/lib/security/enforce-rate-limit", () => ({
  enforceApiRateLimit: vi.fn(async () => null),
}));

vi.mock("@/lib/security/csrf-server", () => ({
  validateCsrf: vi.fn(async () => true),
}));

vi.mock("@/lib/documents/fill-pdf-acroform", () => ({
  fillPdfFromMappedFields,
}));

function adminFrom(table: string) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => {
      if (table === "transactions") {
        return {
          data: {
            id: "00000000-0000-4000-8000-000000000003",
            tenant_id: "00000000-0000-4000-8000-000000000002",
            property_address: "123 Main St",
            mls_number: "MLS-1",
            close_date: "2026-06-01",
            notes: "Ready",
            intake_data: {},
          },
          error: null,
        };
      }
      if (table === "transaction_document_selections") {
        return {
          data: {
            id: "00000000-0000-4000-8000-000000000004",
            transaction_id: "00000000-0000-4000-8000-000000000003",
            tenant_id: "00000000-0000-4000-8000-000000000002",
            template_id: "00000000-0000-4000-8000-000000000005",
            template_version_id: "00000000-0000-4000-8000-000000000006",
          },
          error: null,
        };
      }
      if (table === "global_document_templates") {
        return {
          data: {
            id: "00000000-0000-4000-8000-000000000005",
            form_number: "NMAR-100",
            category: "contract",
          },
          error: null,
        };
      }
      if (table === "global_document_template_versions") {
        return {
          data: {
            id: "00000000-0000-4000-8000-000000000006",
            template_id: "00000000-0000-4000-8000-000000000005",
            storage_path:
              "templates/global/00000000-0000-4000-8000-000000000005/00000000-0000-4000-8000-000000000006/nmar-100.pdf",
            field_mappings: {
              Address: "property_address",
            },
            review_status: "approved",
            mapping_review_status: "approved",
            is_active: true,
          },
          error: null,
        };
      }
      return { data: null, error: null };
    }),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createServiceRoleClient: vi.fn(() => ({
    from: vi.fn((table: string) => adminFrom(table)),
    storage: {
      from: vi.fn(() => ({
        download,
      })),
    },
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    storage: {
      from: vi.fn(() => ({
        upload,
      })),
    },
    from: vi.fn((table: string) => {
      if (table !== "documents") throw new Error(`unexpected table ${table}`);
      return {
        insert: documentsInsert,
      };
    }),
  })),
}));

describe("generated document API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    documentsInsert.mockReturnValue({
      select: vi.fn(() => ({
        single: vi.fn(async () => ({
          data: {
            id: "00000000-0000-4000-8000-000000000007",
            category: "contract",
            status: "uploaded",
            file_name: "123_NMAR-100.pdf",
            mime_type: "application/pdf",
            created_at: "2026-05-11T19:00:00.000Z",
            storage_path:
              "00000000-0000-4000-8000-000000000002/00000000-0000-4000-8000-000000000003/generated/123_NMAR-100.pdf",
            generated_from_template_version_id:
              "00000000-0000-4000-8000-000000000006",
          },
          error: null,
        })),
      })),
    });
  });

  it("inserts generated document metadata with template version and source snapshot", async () => {
    const { POST } = await import(
      "@/app/api/transactions/[id]/documents/generate/route"
    );
    const req = new Request(
      "http://localhost/api/transactions/00000000-0000-4000-8000-000000000003/documents/generate",
      {
        method: "POST",
        body: JSON.stringify({
          selection_id: "00000000-0000-4000-8000-000000000004",
        }),
      },
    );

    const res = await POST(req as any, {
      params: { id: "00000000-0000-4000-8000-000000000003" },
    });

    expect(res.status).toBe(200);
    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(
        /^00000000-0000-4000-8000-000000000002\/00000000-0000-4000-8000-000000000003\/generated\/\d+_NMAR-100\.pdf$/,
      ),
      expect.any(Buffer),
      { contentType: "application/pdf", upsert: false },
    );
    expect(documentsInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        tenant_id: "00000000-0000-4000-8000-000000000002",
        transaction_id: "00000000-0000-4000-8000-000000000003",
        category: "contract",
        status: "uploaded",
        mime_type: "application/pdf",
        generated_from_template_version_id:
          "00000000-0000-4000-8000-000000000006",
        source_data_snapshot: expect.objectContaining({
          template_id: "00000000-0000-4000-8000-000000000005",
          template_version_id: "00000000-0000-4000-8000-000000000006",
          form_number: "NMAR-100",
          field_snapshot: expect.objectContaining({
            property_address: "123 Main St",
          }),
        }),
      }),
    );
    expect(insertApiAudit).toHaveBeenCalledWith(
      req,
      expect.anything(),
      expect.objectContaining({
        operation: "documents.generate_pdf",
      }),
    );
    expect(fillPdfFromMappedFields).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldMappings: { Address: "property_address" },
      }),
    );
  });
});
