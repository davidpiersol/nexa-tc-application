# TC Intake Field Dictionary

Canonical, deduplicated keys for TC capture. Sections are intentionally ordered as: **TC/Internal, Seller, Seller Broker(s), Buyer, Buyer Broker(s)**.

## Required Field Mapping (Placeholder)

TODO: Map each field below as **required vs optional** by transaction stage and form packet.

## TC / Internal Capture

- `tc_engaged` — boolean
- `tc_review_completed_by` — string
- `tc_review_completed_at` — date
- `source_forms_received` — string
- `follow_up_required` — boolean
- `follow_up_notes` — string
- `tc_representation_side` — enum (`seller_listing_broker`, `buyer_broker`, `both`)

## Seller / Listing Client

- `sellers_names` — string
- `seller_signature_captured` — boolean (default `false`)
- `seller_signature_date` — date (default blank)
- `seller_is_nm_broker` — boolean
- `seller_has_other_listing_agreement` — boolean
- `conflict_of_interest_disclosed` — boolean
- `conflict_of_interest_explanation` — string
- `adverse_material_facts_disclosed` — boolean
- `adverse_material_facts_explanation` — string
- `property_legal_description` — string
- `property_type` — enum (`residential`, `new_construction`, `manufactured`, `multi_family`, `modular`, `offsite_built`, `other`)
- `community_type` — enum (`rural`, `subdivision`, `condo`, `townhouse`, `mobile_home`, `other`)
- `farm_and_ranch` — boolean
- `rights_conveyed` — boolean
- `rights_conveyed_explanation` — string
- `fixture_exclusions` — string

## Listing Broker / Seller's Broker(s)

Repeatable broker group normalized as indexed entries:

- `seller_broker_1_*`
- `seller_broker_2_*`

Fields per entry:

- `brokerage_firm` — string
- `qualifying_broker_name` — string
- `nmrec_license_no` — string
- `broker_name` — string
- `team_name` — string
- `office_phone` — string
- `cell_phone` — string
- `email` — string
- `address` — string
- `city` — string
- `state` — string
- `zip_code` — string
- `is_realtor` — boolean

## Buyer / Buyer Client

- `buyers_names` — string
- `buyer_signature_captured` — boolean (default `false`)
- `buyer_signature_date` — date (default blank)
- `buyer_is_nm_broker` — boolean
- `buyer_has_other_broker_agreement` — boolean

## Buyer's Broker(s)

Repeatable broker group normalized as indexed entries:

- `buyer_broker_1_*`
- `buyer_broker_2_*`

Fields per entry:

- `brokerage_firm` — string
- `qualifying_broker_name` — string
- `nmrec_license_no` — string
- `broker_name` — string
- `team_name` — string
- `office_phone` — string
- `cell_phone` — string
- `email` — string
- `address` — string
- `city` — string
- `state` — string
- `zip_code` — string
- `is_realtor` — boolean
