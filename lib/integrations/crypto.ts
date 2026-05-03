/**
 * AES-256-GCM encryption for credentials persisted in `api_integrations.credentials_json`.
 * Key: `API_INTEGRATIONS_ENCRYPTION_KEY` — base64-encoded **32-byte** secret (generate once, store in vault).
 */
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { IntegrationConfigError } from "@/lib/integrations/errors";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function loadKey(): Buffer {
  const b64 = process.env.API_INTEGRATIONS_ENCRYPTION_KEY;
  if (!b64?.trim()) {
    throw new IntegrationConfigError(
      "crypto",
      "Missing API_INTEGRATIONS_ENCRYPTION_KEY (base64-encoded 32-byte key)",
    );
  }
  const key = Buffer.from(b64.trim(), "base64");
  if (key.length !== KEY_LENGTH) {
    throw new IntegrationConfigError(
      "crypto",
      `API_INTEGRATIONS_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes; got ${key.length}`,
    );
  }
  return key;
}

/** Encrypt arbitrary JSON-serializable credentials → opaque base64 string for JSON storage. */
export function encryptCredentialsPayload(payload: Record<string, unknown>): string {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

/** Decrypt payload produced by {@link encryptCredentialsPayload}. */
export function decryptCredentialsPayload<T extends Record<string, unknown>>(
  ciphertextBase64: string,
): T {
  const key = loadKey();
  const buf = Buffer.from(ciphertextBase64, "base64");
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error("invalid_ciphertext_length");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const enc = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(plain.toString("utf8")) as T;
}
