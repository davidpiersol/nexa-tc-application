# MLS Write-Access Spike

## Decision

Choral Point should not write listings into SWMLS, GAAR, FlexMLS, or any MLS provider until write/listing-submission access is confirmed in writing and tested in a sandbox or vendor-approved test path.

## Current Scope

P23 adds an MLS-only job workflow for service requests where the TC is only entering a listing into MLS, not managing the transaction through closing.

The workflow is intentionally separate from full TC transactions and excludes buyer-side fields by default.

The current MLS-only form is intake scaffolding, not a complete MLS input form. FlexMLS/SWMLS required fields vary by MLS, property type, listing status, and local rules; Choral Point needs the official SWMLS/FlexMLS input form or screenshots of each listing-entry tab before it can model every required field.

Expected future MLS entry sections include, at minimum:

- General/listing setup: property type, listing member, listing office, listing agreement dates, list price, listing status, compensation/remarks fields where applicable.
- Address and location: full situs address, county, city, ZIP, subdivision, map/GIS, parcel/APN, legal description, directions.
- Property facts: beds/baths where applicable, square footage, acres/lot square feet, year built, stories, garage/parking, construction/style, utilities.
- Land/ranch/commercial-specific facts: zoning, topography, water/sewer/electric/gas availability, frontage/access, lease terms where applicable.
- Disclosures/documents/media: required disclosures, lead-based paint where applicable, photos, supplements, broker/public remarks, showing instructions.
- Compliance and publishing: required field validation, MLS warnings, office/broker review, and final submit/activation path.

## What Must Be Confirmed

- Which MLS system is authoritative for the target users: SWMLS through GAAR, FlexMLS, another RESO provider, or a broker-specific portal.
- Whether the provider supports write/listing submission API access, not only IDX/VOW/read access.
- Whether API write access supports create, update, media upload, document upload, validation, and submission status.
- Whether credentials are granted per brokerage, per broker, per TC, or through a platform/vendor partner agreement.
- Whether listing entry requires human review inside the MLS portal before publishing.
- Whether fees, certification, or vendor agreements apply.

## Implementation Guardrail

The existing `lib/mls/client.ts` remains read-oriented. P23 does not implement MLS write submission.

Future write integration should be a separate sprint after access is confirmed and should start with provider-specific sandbox tests.

See `docs/mls-entry-field-model.md` for the provisional Choral Point tabbed MLS entry model and rule-engine plan.
