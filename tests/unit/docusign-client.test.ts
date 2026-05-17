import { beforeEach, describe, expect, it, vi } from "vitest";

const { fetchWithRetryMock } = vi.hoisted(() => ({
  fetchWithRetryMock: vi.fn(),
}));

vi.mock("jose", () => ({
  importPKCS8: vi.fn(async () => ({})),
  SignJWT: class {
    setProtectedHeader() {
      return this;
    }
    setIssuer() {
      return this;
    }
    setSubject() {
      return this;
    }
    setAudience() {
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime() {
      return this;
    }
    async sign() {
      return "jwt";
    }
  },
}));

vi.mock("@/lib/integrations/credentials-store", () => ({
  INTEGRATION_PROVIDERS: { docusign: "docusign" },
  getTenantCredentials: vi.fn(async () => ({
    integrationKey: "integration-key",
    userId: "user-id",
    accountId: "account-id",
    rsaPrivateKeyPem: "-----BEGIN PRIVATE KEY-----\nabc\n-----END PRIVATE KEY-----",
    oAuthBasePath: "account-d.docusign.com",
    restBasePath: "https://demo.docusign.net/restapi",
  })),
}));

vi.mock("@/lib/integrations/fetch-with-retry", () => ({
  fetchWithRetry: fetchWithRetryMock,
}));

vi.mock("@/lib/integrations/audit", () => ({
  auditIntegrationAction: vi.fn(async () => undefined),
}));

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  }) as Response;
}

describe("DocuSign client", () => {
  beforeEach(() => {
    fetchWithRetryMock.mockReset();
  });

  it("creates an envelope through the eSignature API", async () => {
    fetchWithRetryMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "token" }))
      .mockResolvedValueOnce(jsonResponse({ envelopeId: "env-123" }));

    const { createEnvelope } = await import("@/lib/docusign/client");
    await expect(
      createEnvelope({
        tenantId: "tenant-1",
        envelopeDefinition: { status: "sent" },
        actorId: "actor-1",
      }),
    ).resolves.toEqual({ envelopeId: "env-123" });

    expect(fetchWithRetryMock).toHaveBeenCalledWith(
      "https://demo.docusign.net/restapi/v2.1/accounts/account-id/envelopes",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("gets envelope and recipient delivery status", async () => {
    fetchWithRetryMock
      .mockResolvedValueOnce(jsonResponse({ access_token: "token" }))
      .mockResolvedValueOnce(
        jsonResponse({ envelopeId: "env-123", status: "completed", statusChangedDateTime: "2026-05-13T18:00:00Z" }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          signers: [
            {
              email: "client@example.com",
              name: "Client One",
              recipientId: "1",
              status: "delivered",
              deliveredDateTime: "2026-05-13T17:00:00Z",
              signedDateTime: null,
            },
          ],
        }),
      );

    const { getEnvelopeStatus } = await import("@/lib/docusign/client");
    await expect(
      getEnvelopeStatus({
        tenantId: "tenant-1",
        envelopeId: "env-123",
        actorId: "actor-1",
      }),
    ).resolves.toMatchObject({
      envelopeId: "env-123",
      status: "completed",
      recipients: [{ email: "client@example.com", status: "delivered" }],
    });
  });
});
