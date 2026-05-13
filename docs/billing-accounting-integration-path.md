# Billing and Accounting Integration Path

## P24 Scope

P24 adds Choral Point billing scaffolding:

- Service types for full TC transaction, MLS-only entry, and custom work.
- Invoice records linked to a requesting broker/client name and optionally to a transaction or MLS-only job.
- Invoice line items with centralized total calculation.
- Accounts receivable status tracking.
- Monthly, quarterly, and yearly summary scaffolding.

P24 does not implement:

- Tax filing.
- Sales tax calculation.
- Payment processing.
- QuickBooks sync.
- Profit Power sync.
- Profit Power, QuickBooks, or payment-provider credential storage.
- External invoice sending.

## Provider Candidates

### QuickBooks Online

Intuit documents a QuickBooks Online Accounting API with invoice entities and workflows for creating invoices. A future integration would require an Intuit Developer app, OAuth connection, customer mapping, product/service item mapping, and sandbox tests.

Questions before implementation:

- Should Choral Point create QuickBooks customers or require selecting existing customers?
- Which QuickBooks product/service item should map to each Choral Point service type?
- Should Choral Point create draft invoices, send invoices, or only export/sync invoice data?
- How should payment status sync back into Choral Point?
- Who owns accounting corrections: Choral Point or QuickBooks?

### Profit Power

Profit Power is real estate back-office/accounting software. Public information indicates it supports integrations and has REST API documentation behind a credentialed endpoint. A future integration needs client/vendor credentials and confirmation of permitted invoice or receivable operations.

Questions before implementation:

- Does the client have Profit Power API access?
- Can invoices/accounts receivable be created through the API, or only read/synced?
- Which broker, office, listing, closing, or associate identifiers are required?
- Does Profit Power expect transaction/closing records before invoices?
- Are credentials tenant-level, broker-level, or platform-level?

### Payment Providers

Payment-provider integration should be a separate sprint after deciding whether Choral Point owns payment collection or only records receivable status from an accounting system.

Possible future providers:

- QuickBooks Payments if QuickBooks Online is the system of record.
- Stripe for standalone card/ACH collection.
- A broker-provided payment link if the brokerage already has a receivables workflow.

## Recommended Future Architecture

Use provider adapters instead of wiring provider logic directly into invoice routes:

```ts
type AccountingProviderAdapter = {
  provider: "quickbooks" | "profit_power" | "manual";
  createInvoice(input: CanonicalInvoice): Promise<AccountingSyncResult>;
  getInvoiceStatus(externalId: string): Promise<AccountingInvoiceStatus>;
};
```

Keep Choral Point as the canonical internal source for service type, source transaction/MLS job, and billing notes. Treat external providers as sync targets until a full accounting source-of-truth decision is made.

## Security Guardrails

- Tenant admins can manage only their tenant billing settings.
- Global admins can configure platform provider catalogs and integration defaults.
- TCs can create invoices only inside their tenant.
- Broker/client users should not see billing unless explicitly added in a later sprint.
- Provider credentials must be encrypted and never stored in plain JSON fields.
- Every external sync must create an audit event.

## Sources Checked

- Intuit QuickBooks Online Accounting API documentation: https://developer.intuit.com/app/developer/qbo/docs/learn/explore-the-quickbooks-online-api
- Intuit QuickBooks invoice workflow documentation: https://developer.intuit.com/app/developer/qbo/docs/workflows/create-an-invoice
- LanTrax Profit Power overview: https://lantrax.com/profit-power/
- Profit Power API documentation portal: https://api.profitpowerweb.com/doc/
