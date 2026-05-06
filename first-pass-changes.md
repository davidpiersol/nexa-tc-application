# NEXA Sprint Checklist by User Login

## Agent Login

- [X] Add logout functionality
- [X] Make top-right role indicator clickable
- [X] Add profile view/access for logged-in agent
- [ ] Fix Transactions > All transactions > Open routing so it does not return 404
- [ ] Make dashboard summary cards clickable
  - [ ] Active transactions
  - [ ] Due this week
  - [ ] Pending reviews
  - [ ] Signatures needed
- [ ] Make Deadlines items clickable to open detail views
- [ ] Make Tasks items clickable to open detail views

## TC Login

- [ ] Add logout functionality
- [ ] Add profile view/access from top-right area
- [ ] Implement TC settings
- [ ] Implement TC preferences

## Buyer Login

- [ ] Add logout functionality
- [ ] Fix View documents link
- [ ] Fix Message TC button
- [ ] Seed sample documents
  - [ ] Purchase agreement
  - [ ] Seller disclosure
  - [ ] Home inspection
  - [ ] Loan estimate
  - [ ] Title report
  - [ ] Property photos
- [ ] Fix Actions needed > Open disclosure so it opens actual data
- [ ] Clarify/document buyer workflow behavior

## Seller Login

- [ ] Add logout functionality
- [ ] Add seller profile view/access
- [ ] Fix Upload disclosure action
- [ ] Fix View offer action
- [ ] Seed seller-side data for testing
- [ ] Add dates to sale progress milestones
- [ ] Show clearer milestone state for inspection
- [ ] Show milestone state for appraisal
- [ ] Show milestone state for clear to close
- [ ] Show milestone state for closing

## Mortgage Login

- [ ] Add logout functionality
- [ ] Add mortgage profile view/access
- [ ] Make loan milestones interactive
- [ ] Add access to uploaded files for review
- [ ] Design TC-first email ingestion flow for mortgage documents
- [ ] Allow TC review before pushing documents to end users

## Title Login

- [ ] Add logout functionality
- [ ] Add title profile view/access
- [ ] Replace or clarify checklist behavior
- [ ] Rework title area into repository-style document handling
- [ ] Support email ingestion to TC
- [ ] Create downstream action items for TC, buyer, or seller

## Admin Login

- [ ] Separate admin functions from TC-style dashboard behavior
- [ ] Add user management
  - [ ] Add users
  - [ ] Delete users
- [ ] Add reporting module
- [ ] Add API key management
- [ ] Add per-tenant configuration
- [ ] Support tenant-specific integrations
  - [ ] DotLoop
  - [ ] DocuSign
  - [ ] DigiSign

## Cross-Cutting

- [ ] Add logout to every login type
- [ ] Add profile access to every login type
- [ ] Fix broken links and buttons across dashboards
- [ ] Seed realistic test data and documents for functional validation

## Final Sprint — Client Required/Optional Mapping

- [ ] Review TC intake field dictionary with client
- [ ] Mark each field as required vs optional by form packet
- [ ] Mark each field as required vs optional by workflow stage
- [ ] Capture client approval and update implementation rules
