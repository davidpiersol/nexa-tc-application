# MLS Entry Field Model

## Important Limitation

This is a Choral Point field model for building the MLS-entry workflow in the app. It is not a certified SWMLS/FlexMLS required-field list.

FlexMLS documentation states that required fields are determined by the MLS, marked in red with an asterisk, and can be filtered by "Required Fields Only" or "Incomplete Required Fields." FlexMLS also states that listing fields vary by MLS and that field choices can depend on previous selections.

Before Choral Point can enforce final required-field rules, collect one of these from SWMLS/GAAR/FlexMLS:

- Official input forms by property type.
- Screenshots/export of each Add Listing tab with "Required Fields Only" enabled.
- Sandbox/API metadata showing required fields and lookup options.

Until then, required rules in Choral Point should be marked as `provisional` and editable by a global admin.

## UX Structure

Use a tabbed wizard with progress by section:

1. Setup
2. Address
3. Property Facts
4. Pricing and Listing Terms
5. Details
6. Rooms and Units
7. Utilities and Land
8. Remarks and Showing
9. Media and Documents
10. Review and Publish Readiness

The app should support:

- Save incomplete MLS entry.
- Required-only view.
- Incomplete-required view.
- Auto-filled fields from transaction/intake/contact/property lookup data.
- Per-property-type required rules.
- Manual fallback when MLS write access is not available.

## Property Type Values

Use a Choral Point display label, but store a normalized MLS/RESO-oriented value where possible:

- Residential
- Residential Income
- Residential Lease
- Land
- Farm/Ranch
- Commercial Sale
- Commercial Lease
- Business Opportunity
- Manufactured Home
- Other

The visible list can be adjusted to match SWMLS exactly after official lookup values are collected.

## Tab 1: Setup

| Field | Type | Autofill Source | Provisional Rule |
| --- | --- | --- | --- |
| Service type | select | MLS-only job | Required, default `MLS only` |
| Property type | select | MLS job | Required |
| Listing member | contact lookup | requesting/listing broker | Required |
| Listing office | contact/broker profile | broker profile | Required when known |
| Co-listing member | contact lookup | broker profile/contact | Optional |
| Requested by broker | contact lookup | MLS job | Required for billing |
| Listing client | contact lookup | seller/listing client | Required |
| Seller names | text/list | transaction/intake | Required |
| Listing agreement type | select | package/forms | Required once official values known |
| Listing agreement date | date | listing agreement form | Required once listing agreement exists |
| List date | date | listing agreement form | Required |
| Expiration date | date | listing agreement form | Required |
| Occupant type | select | intake | Conditional |
| Owner name display preference | select | broker/client preference | Conditional |
| Internal billing status | select | MLS job | Required for Choral Point billing |
| Internal notes | textarea | MLS job | Optional |

## Tab 2: Address

| Field | Type | Autofill Source | Provisional Rule |
| --- | --- | --- | --- |
| Street number | text | property address parser | Required if address exists |
| Street direction prefix | select | property address parser | Conditional |
| Street name | text | property address parser | Required |
| Street suffix | select | property address parser | Conditional |
| Unit number | text | property address parser | Conditional |
| City | text/select | property address/property lookup | Required |
| County | select | property lookup | Required |
| State | select | default NM | Required |
| ZIP | text | property address/property lookup | Required |
| Subdivision | text | property lookup/intake | Conditional |
| Cross streets | text | intake | Optional |
| Directions | textarea | intake | Required if MLS requires |
| Latitude | number | GIS/property lookup | Optional/autofill |
| Longitude | number | GIS/property lookup | Optional/autofill |
| Map code/grid | text | MLS/property lookup | Conditional |
| Parcel/APN/account number | text | county property lookup | Required when available |
| Legal description | textarea | county property lookup/intake | Required for Choral Point intake |
| Tax year | number | county property lookup | Conditional |
| Annual taxes | currency | county property lookup | Conditional |

## Tab 3: Property Facts

| Field | Type | Applies To | Provisional Rule |
| --- | --- | --- | --- |
| Bedrooms total | number | Residential | Required for residential |
| Bathrooms full | number | Residential | Required for residential |
| Bathrooms three-quarter | number | Residential | Conditional |
| Bathrooms half | number | Residential | Conditional |
| Bathrooms total | number/calculated | Residential | Auto-calculate when possible |
| Living area | number | Residential/Residential Income | Required if applicable |
| Living area source | select | Residential/Residential Income | Required when living area entered |
| Year built | number | Residential/Income/Commercial | Required if applicable |
| Year built source | select | Residential/Income/Commercial | Conditional |
| Lot acres | number | All | Required if lot size known |
| Lot square feet | number/calculated | All | Auto-calculate from acres |
| Stories | number/select | Residential | Conditional |
| Garage spaces | number | Residential | Conditional |
| Carport spaces | number | Residential | Conditional |
| Parking total | number/calculated | Residential/Commercial | Conditional |
| Property subtype | select | All | Required after property type |
| Construction materials | multi-select | Residential/Commercial | Conditional |
| Roof | multi-select | Residential/Commercial | Conditional |
| Foundation | select/multi-select | Residential | Conditional |
| Architectural style | multi-select | Residential | Conditional |
| Pool private Y/N | boolean | Residential | Conditional |
| HOA Y/N | boolean | Residential/Land | Conditional |
| HOA dues | currency | Residential/Land | Required if HOA Y |
| HOA frequency | select | Residential/Land | Required if HOA dues |

## Tab 4: Pricing and Listing Terms

| Field | Type | Autofill Source | Provisional Rule |
| --- | --- | --- | --- |
| List price | currency | listing agreement/intake | Required |
| Original list price | currency | list price | Auto-fill from list price |
| Earnest money | currency | listing agreement/intake | Conditional |
| Financing considered | multi-select | listing agreement/intake | Conditional |
| Possession | select/multi-select | listing agreement/intake | Conditional |
| Seller concessions Y/N | boolean | listing agreement/intake | Conditional |
| Compensation notes | textarea | broker preference/intake | Conditional/legal review |
| Variable rate commission Y/N | boolean | listing agreement | Conditional |
| Special listing conditions | multi-select | intake/forms | Conditional |
| Showing start date | date | intake | Conditional |
| On-market date | date | intake | Conditional |

## Tab 5: Details

Use multi-select grouped details. The exact lookup values must come from SWMLS/FlexMLS.

| Group | Applies To | Examples |
| --- | --- | --- |
| Appliances | Residential | Dishwasher, range, refrigerator, washer/dryer |
| Interior features | Residential | Ceiling fans, pantry, walk-in closet |
| Exterior features | Residential/Land | Fencing, patio, storage |
| Heating | Residential/Commercial | Central, forced air, wall furnace |
| Cooling | Residential/Commercial | Refrigerated, evaporative, none |
| Flooring | Residential/Commercial | Carpet, tile, vinyl, wood |
| Fireplace | Residential | Count/type |
| Community amenities | Residential | Gated, park, pool |
| Accessibility features | Residential/Commercial | Entry level, accessible bath |
| Security features | Residential/Commercial | Alarm, smoke detector |

## Tab 6: Rooms and Units

Rooms are conditional. FlexMLS documentation notes that room required fields can include room name, length, width, level, and room features, but the tab appearance varies by MLS.

### Rooms

| Field | Type | Rule |
| --- | --- | --- |
| Room name | select | Required per room if rooms entered |
| Length | number | Required per room if rooms entered |
| Width | number | Required per room if rooms entered |
| Level | select | Required per room if rooms entered |
| Room features | multi-select | Required per room if rooms entered |
| Room remarks | text | Optional |

### Units

| Field | Type | Applies To |
| --- | --- | --- |
| Unit number/name | text | Residential Income |
| Beds | number | Residential Income |
| Baths | number | Residential Income |
| Rent | currency | Residential Income |
| Occupancy status | select | Residential Income |
| Lease term | select | Residential Income |
| Unit remarks | text | Residential Income |

## Tab 7: Utilities and Land

| Field | Type | Applies To | Provisional Rule |
| --- | --- | --- | --- |
| Water source | select/multi-select | All | Conditional; likely important for land |
| Sewer | select/multi-select | All | Conditional |
| Electric provider/availability | select/text | All | Conditional |
| Gas provider/availability | select/text | All | Conditional |
| Utilities | multi-select | All | Conditional |
| Internet/cable availability | select/multi-select | All | Optional |
| Zoning | text/select | Land/Commercial/Farm | Conditional |
| Current use | multi-select | Land/Farm/Commercial | Conditional |
| Possible use | multi-select | Land/Farm/Commercial | Conditional |
| Road frontage/type | select/multi-select | Land/Farm/Commercial | Conditional |
| Topography | multi-select | Land/Farm | Conditional |
| Vegetation | multi-select | Land/Farm | Optional |
| Fencing | multi-select | Land/Farm/Residential | Conditional |
| Water rights | text/select | Farm/Ranch/Land | Conditional |
| Irrigation source | text/select | Farm/Ranch/Land | Conditional |

## Tab 8: Remarks and Showing

| Field | Type | Provisional Rule |
| --- | --- | --- |
| Public remarks | textarea | Required once official MLS max length known |
| Private/broker remarks | textarea | Conditional |
| Directions remarks | textarea | Conditional if not captured on Address |
| Showing instructions | textarea/select | Required if listed active |
| Showing service | select | Conditional |
| Lockbox type | select | Conditional |
| Lockbox serial/code | text | Sensitive; restrict visibility |
| Occupant name/contact | text/contact | Sensitive; restrict visibility |
| Appointment required Y/N | boolean | Conditional |
| Sign on property Y/N | boolean | Conditional |
| Internet display Y/N | boolean | Conditional |
| Address display Y/N | boolean | Conditional |
| Automated valuation display Y/N | boolean | Conditional |
| Consumer comment Y/N | boolean | Conditional |

## Tab 9: Media and Documents

FlexMLS notes that photos/documents/videos may not be available during initial listing entry in some workflows and may be added after saving incomplete or changing a listing.

| Field | Type | Rule |
| --- | --- | --- |
| Primary photo | file | Conditional if MLS requires before save |
| Additional photos | file list | Conditional |
| Photo captions/descriptions | text list | Conditional |
| Virtual tour URL | url | Optional |
| Floor plan | file | Optional |
| Required MLS documents | checklist/file links | Conditional by property type/package |
| Lead-based paint disclosure | file/checklist | Required if residential built before 1978 |
| Seller property disclosure | file/checklist | Conditional |
| HOA documents | file/checklist | Required if HOA Y and broker/package requires |
| Plat/survey | file/checklist | Conditional for land |

## Tab 10: Review and Publish Readiness

| Field/Check | Type | Rule |
| --- | --- | --- |
| Required field completion | computed checklist | Required before publish-ready |
| Incomplete required fields | computed list | Blocks publish-ready |
| Missing documents | computed list | Blocks if required by package/rule |
| MLS write access status | computed | Must be confirmed before direct API publish |
| Manual MLS entry needed | computed | Default true |
| MLS number | text | Filled after manual MLS entry or API publish |
| MLS submission status | select | Draft, ready, submitted, active, rejected, cancelled |
| Validation warnings | list | Non-blocking unless configured |
| Broker review complete | boolean | Conditional by tenant/broker profile |

## Autofill Rules

| Destination | Source |
| --- | --- |
| Requesting broker | MLS job/requestor |
| Listing broker/member | Broker contact/profile |
| Listing office | Broker profile/company |
| Seller/listing client | Contact selected on job or transaction |
| Address fields | Parsed property address |
| Parcel/APN/account number | Statewide NM property lookup |
| Legal description | Statewide NM property lookup or intake |
| County/city/ZIP | Address parser/property lookup |
| Lot acres/sqft | Property lookup; calculate reciprocal value |
| Tax year/taxes | Property lookup |
| HOA fields | Intake/forms |
| Lead-based paint rule | Year built < 1978 |
| Required document checklist | Package rules by property type, broker, and transaction/listing type |

## Rule Engine Shape

Rules should be data-driven, not hard-coded in React:

```json
{
  "fieldKey": "lead_based_paint_disclosure",
  "requiredWhen": {
    "all": [
      { "field": "property_type", "operator": "in", "value": ["Residential", "Residential Income"] },
      { "field": "year_built", "operator": "<", "value": 1978 }
    ]
  },
  "severity": "blocking",
  "source": "provisional",
  "reviewStatus": "needs_swmls_confirmation"
}
```

Global admins should be able to update:

- Field labels.
- Required/optional status.
- Property-type applicability.
- Lookup values.
- Help text.
- Validation rules.
- SWMLS/FlexMLS source references.

Tenant admins should be able to configure tenant/broker defaults without changing global SWMLS rules.

## Recommended Implementation Sprints

1. Add `mls_entry_field_definitions`, `mls_entry_rule_sets`, and `mls_entry_values` tables.
2. Build the tabbed MLS entry UI from the field definition registry.
3. Add autofill from contacts, transaction intake, broker profile, and property lookup.
4. Add required/incomplete-required filters.
5. Add global-admin field/rule editor.
6. Import official SWMLS/FlexMLS required field metadata once available.
7. Add MLS API write adapter only after write access is confirmed.
