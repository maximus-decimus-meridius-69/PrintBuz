# Product Spec

## Objective
Provide a simple poster ordering system with two distinct customer flows and one admin dashboard:
- `CEER`: upload-based poster orders
- `AZURA`: Google Drive link-based poster orders

The system should be easy to operate for admins and easy to hand off to a future engineer without rediscovery work.

## Core Product Requirements

### CEER
- User submits a poster order with academic details and a file upload
- Payment is required before the order is finalized
- Poster file is stored in Supabase Storage after payment verification
- Admin can:
  - filter CEER orders by course, department, section, year
  - download the poster
  - see whether the poster was downloaded
  - mark the order as printed
  - delete the order

### AZURA
- User submits an order using:
  - name
  - phone number
  - email
  - fixed poster width of 6
  - selected height from predefined options
  - Google Drive link
- Payment is required before the order is finalized
- No file upload is used for AZURA
- Admin can:
  - open the submitted link
  - mark the order as printed
  - delete the order
- AZURA does not use downloaded tracking

## Validation Rules

### CEER
- Department must be selected from the fixed list:
  - `CSE`
  - `CSC`
  - `CSD`
  - `CSE-AIML`
  - `ECE`
  - `EEE`
  - `MECH`
  - `CIVIL`
- Section must be exactly one alphabet
- Course must be selected from the supported course list
- Year must be selected from the supported year list

### AZURA
- Phone number must be exactly 10 digits
- Link must be a Google Drive URL only
- Width is fixed and not editable
- Height must be one of the supported sizes

## Pricing Rules

### CEER
- Flat rate: `Rs. 150`

### AZURA
- `6 x 30` -> `Rs. 2340`
- `6 x 35` -> `Rs. 2730`
- `6 x 40` -> `Rs. 3120`
- `6 x 45` -> `Rs. 3510`
- `6 x 50` -> `Rs. 3900`

All payment amounts must be derived on the server, never trusted from the client.

## Payment Integrity Requirements
- Order row must exist before final payment verification succeeds
- Verification must reject requests when:
  - order is missing
  - order is already paid
  - stored amount does not match expected amount
  - stored Razorpay order id does not match incoming order id
- Signature verification is mandatory for both CEER and AZURA

## Admin Dashboard Requirements

### General
- Admin dashboard requires authenticated Supabase session
- Admin email must also match configured admin allow-list
- Sign out must be POST-only
- Admin view must split CEER and AZURA into separate tabs

### CEER Tab
- Preserve academic filters
- Show only paid CEER orders
- Support download tracking
- Use `Printed` wording for print completion status

### AZURA Tab
- No academic filter UI
- Show only paid AZURA orders
- Show `Open link`, not `Download`
- No downloaded toggle
- Use `Printed` wording for print completion status

## UX Requirements

### AZURA Instructions
- AZURA page must provide an `Instructions` button
- Clicking it must open a modal
- Modal must explain how to create a valid Google Drive share link

### Minimal Operational Friction
- Forms should prevent invalid input as early as possible
- Server validation must still enforce the same constraints

## Data Model Requirements
- CEER and AZURA must be stored separately:
  - `poster_orders` for CEER
  - `azura_orders` for AZURA
- CEER and AZURA should not be forced into one mixed nullable table unless requirements change substantially

## Operational Notes
- Dev server is intended to run on port `3000`
- `npm run lint` should pass after changes
- Schema changes must remain rerunnable without failing on duplicate policy creation

## Handoff Goal
Any engineer taking over should be able to understand:
- what each flow does
- what is intentionally different between CEER and AZURA
- which validations are business rules rather than UI choices
- where payment integrity is enforced
- how admin actions map to product expectations