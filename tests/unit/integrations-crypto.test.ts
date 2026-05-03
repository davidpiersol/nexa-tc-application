import { randomBytes } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import {
  decryptCredentialsPayload,
  encryptCredentialsPayload,
} from "@/lib/integrations/crypto";

const KEY_B64 = randomBytes(32).toString("base64");

describe("integrations crypto (AES-256-GCM)", () => {
  afterEach(() => {
    delete process.env.API_INTEGRATIONS_ENCRYPTION_KEY;
  });

  it("round-trips JSON credentials", () => {
    process.env.API_INTEGRATIONS_ENCRYPTION_KEY = KEY_B64;
    const plain = { clientId: "a", token: "b", n: 1 };
    const enc = encryptCredentialsPayload(plain);
    expect(enc).toBeTruthy();
    const out = decryptCredentialsPayload<typeof plain>(enc);
    expect(out).toEqual(plain);
  });
});
