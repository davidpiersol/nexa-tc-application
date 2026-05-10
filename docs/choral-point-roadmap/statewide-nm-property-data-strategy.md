# Statewide New Mexico Property Data Strategy

## Goal

Choral Point must be able to query or capture property data for any property in New Mexico, not only Valencia County.

The intake/add transaction page should support a property lookup flow that can populate or suggest:

- Property address
- County
- Parcel/account/APN
- Legal description
- Owner
- Mailing address
- Acreage or lot size
- Assessed/tax values where available
- GIS/map link
- Transfer/sale history where available
- Source provider/county
- Retrieval timestamp
- Confidence/source notes

## Recommended Architecture

Use a provider-first strategy:

1. Licensed statewide/national provider
   - Prefer ATTOM or an equivalent licensed property-data provider when credentials are configured.
   - ATTOM is a good candidate because the current Choral Point repo already has an ATTOM-style property client and ATTOM advertises nationwide property API coverage.

2. County connector registry
   - Model each New Mexico county as a connector record.
   - Do not hard-code Valencia County or EagleWeb.
   - Valencia County/EagleWeb should be one connector entry.

3. Manual and AI-assisted fallback
   - If no structured provider or safe county connector is available, the TC can paste assessor/GIS text into the app.
   - AI may extract suggested fields from pasted text.
   - The TC must approve suggested fields before they are saved.

## County Connector Registry Fields

Create a registry table/config such as `property_data_county_sources`:

- `state`: `NM`
- `county_name`
- `county_fips`
- `portal_type`: `eagleweb`, `gis`, `assessor_site`, `arcgis`, `manual_only`, `api`, `unknown`
- `search_url`
- `api_base_url`
- `supported_lookup_keys`: address, parcel, account, owner, coordinates
- `structured_api_available`: boolean
- `automation_allowed`: boolean
- `requires_auth`: boolean
- `terms_review_status`: `not_reviewed`, `approved`, `blocked`
- `notes`
- `last_verified_at`

## Source Rules

- Never overwrite user-entered intake fields without confirmation.
- Store source metadata per imported field or per lookup snapshot.
- Keep a raw provider/county response snapshot where licensing allows.
- Use deterministic parsing for structured data.
- Use AI only for pasted/unstructured text or summarization, not as the authoritative data source.
- Disable scraping by default.
- Only enable automated portal access after legal/terms and reliability review.

## Data Model Suggestions

Add or extend:

- `property_lookup_sources`
- `property_lookup_runs`
- `property_lookup_suggestions`
- `transactions.property_data`
- `transactions.intake_data.property_legal_description`

Each lookup run should record:

- Provider/county source
- Query type and normalized query
- Success/failure status
- Retrieved fields
- Missing fields
- User accepted/rejected fields
- Timestamp
- User id

## Sprint Build Prompt

Use this prompt for the statewide property-data sprint:

```text
Implement Choral Point statewide New Mexico property data lookup scaffolding.

Requirements:
- Do not assume Valencia County only.
- Prefer ATTOM or another configured statewide/national provider when credentials exist.
- Add a county connector registry for New Mexico counties.
- Represent Valencia County/EagleWeb as one registry entry, not special-case logic.
- Support address and parcel/account/APN lookup where available.
- Normalize provider/county responses into canonical transaction property fields.
- Store source provider/county, retrieval timestamp, and confidence/source notes.
- Support manual copy/paste entry and AI-assisted extraction when no structured source is available.
- Require human confirmation before imported or AI-extracted fields overwrite transaction intake data.
- Disable scraping/automated portal access unless terms, auth, robots, and reliability are approved.
- Add focused unit tests and one browser smoke flow from transaction intake.
```

## Test Checklist

- Provider selection prefers configured statewide provider.
- Provider selection falls back to county connector.
- Unsupported or unreviewed county source falls back to manual entry.
- Valencia County works through the registry.
- Non-Valencia county can be represented without code changes.
- Imported fields show source metadata.
- User can accept or reject suggested field updates.
- AI extraction cannot save fields without confirmation.
- App works without ATTOM or other paid provider credentials.

## Sources Checked

- [ATTOM Property Data API](https://www.attomdata.com/solutions/api/) - public product page describes nationwide property API coverage and address/APN-style lookup.
- [ATTOM API Documentation](https://api.developer.attomdata.com/docs) - developer documentation entry point.
- [New Mexico RGIS / Earth Data Analysis Center](https://edac.unm.edu/rgis/) - state geospatial clearinghouse context.
- [New Mexico Taxation and Revenue GIS Data Files](https://www.tax.newmexico.gov/businesses/data-download/) - notes that TRD does not publish county real-property parcel data directly, which supports a provider/county-registry fallback model.
