/**
 * Typed errors for external integration clients (MLS, ATTOM, DocuSign, Postmark, Plaid).
 */

export type IntegrationErrorCode =
  | "config_missing"
  | "credentials_missing"
  | "decrypt_failed"
  | "http_error"
  | "oauth_error"
  | "rate_limited"
  | "provider_error"
  | "validation_error";

export class IntegrationError extends Error {
  readonly code: IntegrationErrorCode;
  readonly status?: number;
  readonly provider: string;
  readonly detail?: Record<string, unknown>;

  constructor(
    provider: string,
    code: IntegrationErrorCode,
    message: string,
    opts?: { status?: number; detail?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, opts?.cause ? { cause: opts.cause } : undefined);
    this.name = "IntegrationError";
    this.provider = provider;
    this.code = code;
    this.status = opts?.status;
    this.detail = opts?.detail;
  }
}

export class IntegrationConfigError extends IntegrationError {
  constructor(provider: string, message: string, cause?: unknown) {
    super(provider, "config_missing", message, { cause });
    this.name = "IntegrationConfigError";
  }
}

export class IntegrationCredentialsError extends IntegrationError {
  constructor(provider: string, message: string, cause?: unknown) {
    super(provider, "credentials_missing", message, { cause });
    this.name = "IntegrationCredentialsError";
  }
}
