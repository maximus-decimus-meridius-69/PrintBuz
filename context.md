# Project Context

## Overview
- Project name: Poster Desk / PrintBuz
- Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Razorpay, Nodemailer
- Purpose: collect poster orders for two event flows and provide an admin dashboard to manage them

## Current Product State
- `CEER` is live
- `AZURA` is live
- Dev server is expected to run on `http://localhost:3000`
- `npm run lint` currently passes
- Supabase schema has already been updated to include the latest CEER columns and the new `azura_orders` table

## Route Map
- `/`: landing page
- `/ceer`: CEER order form
- `/azura`: AZURA order form with Google Drive instructions modal
- `/admin/login`: admin sign-in
- `/admin`: admin dashboard with CEER and AZURA tabs

## CEER Flow
1. User opens `/ceer`
2. User fills:
   - roll number
   - department from dropdown only
   - year
   - course
   - email
   - section as exactly one alphabet
3. User uploads the poster file
4. `/api/create-order` creates a pending CEER row and a Razorpay order
5. Razorpay completes payment
6. `/api/payment/verify` verifies signature and validates:
   - order exists
   - order is still pending
   - stored amount matches expected CEER amount
   - stored Razorpay order id matches incoming id
7. Poster is uploaded to Supabase Storage
8. CEER order is marked paid
9. Confirmation email is sent if SMTP is configured

## AZURA Flow
1. User opens `/azura`
2. User can open an instructions modal for Google Drive sharing steps
3. User fills:
   - name
   - phone number, exactly 10 digits
   - email
   - fixed width of 6
   - height option from fixed price list
   - Google Drive link only
4. `/api/azura/create-order` creates a pending AZURA row and a Razorpay order
5. Razorpay completes payment
6. `/api/azura/payment/verify` verifies signature and validates:
   - order exists
   - order is still pending
   - stored amount matches the server-derived size price
   - stored Razorpay order id matches incoming id
7. AZURA order is marked paid
8. Confirmation email is sent if SMTP is configured

## Pricing
- CEER: fixed `Rs. 150`
- AZURA:
  - `6 x 30 = Rs. 2340`
  - `6 x 35 = Rs. 2730`
  - `6 x 40 = Rs. 3120`
  - `6 x 45 = Rs. 3510`
  - `6 x 50 = Rs. 3900`

## CEER Form Constraints
- Department must be one of:
  - `CSE`
  - `CSC`
  - `CSD`
  - `CSE-AIML`
  - `ECE`
  - `EEE`
  - `MECH`
  - `CIVIL`
- Section must be exactly one alphabet and is normalized to uppercase in the UI

## Admin Behavior

### Authentication
- `/admin` is protected by middleware and server-side allow-list checks
- Admin email must exist in `ADMIN_EMAILS`
- Sign out is POST-only to avoid accidental logout from route prefetching

### CEER Admin Tab
- Keeps academic filters unchanged:
  - course
  - department
  - section
  - year
- Shows paid CEER orders only
- Supports:
  - download button
  - downloaded indicator
  - printed toggle
  - delete
- Downloaded means admin clicked the in-app download button

### AZURA Admin Tab
- No academic filters
- Shows paid AZURA orders only
- Displays:
  - name
  - phone
  - email
  - size
  - amount
  - open link
  - printed toggle
  - delete
- AZURA does not track downloaded state

## Database Model

### Table: `poster_orders`
Used for CEER orders.

Important columns:
- `id`
- `event`
- `roll_number`
- `department`
- `year`
- `course`
- `email`
- `section`
- `amount`
- `status`
- `downloaded`
- `downloaded_at`
- `downloaded_by`
- `print_done`
- `poster_path`
- `poster_url`
- `razorpay_order_id`
- `razorpay_payment_id`
- `payment_verified_at`
- `created_at`

### Table: `azura_orders`
Used for AZURA orders.

Important columns:
- `id`
- `name`
- `phone`
- `email`
- `width`
- `height`
- `gdrive_url`
- `amount`
- `status`
- `print_done`
- `razorpay_order_id`
- `razorpay_payment_id`
- `payment_verified_at`
- `created_at`

## Important Files
- `src/app/page.tsx`: landing page
- `src/app/ceer/page.tsx`: CEER route
- `src/app/azura/page.tsx`: AZURA route
- `src/app/admin/page.tsx`: admin dashboard
- `src/app/admin/login/page.tsx`: admin login
- `src/components/poster-upload-form.tsx`: CEER form
- `src/components/azura-order-form.tsx`: AZURA form and instructions modal
- `src/components/admin-order-actions.tsx`: admin actions for CEER and AZURA
- `src/app/api/create-order/route.ts`: CEER create order
- `src/app/api/payment/verify/route.ts`: CEER payment verification
- `src/app/api/azura/create-order/route.ts`: AZURA create order
- `src/app/api/azura/payment/verify/route.ts`: AZURA payment verification
- `src/app/api/admin/orders/download/route.ts`: CEER download tracking
- `src/app/api/admin/orders/print-status/route.ts`: CEER printed toggle
- `src/app/api/admin/orders/delete/route.ts`: CEER delete route
- `src/app/api/admin/azura/orders/print-status/route.ts`: AZURA printed toggle
- `src/app/api/admin/azura/orders/delete/route.ts`: AZURA delete route
- `src/lib/supabase/server.ts`: server-side Supabase helpers
- `middleware.ts`: admin auth middleware
- `supabase/schema.sql`: current database schema and policies

## Important Implementation Notes
- CEER payment verification no longer trusts duplicated client form fields
- AZURA amount is always derived on the server from the selected height
- AZURA only accepts Google Drive URLs in validation
- Admin cookie mutation crash was fixed by making server-component cookie writes safe in `src/lib/supabase/server.ts`
- Middleware is responsible for auth cookie refresh on admin routes
- ESLint ignores generated `.next`, `.next-dev`, `.next-build`, and `next-env.d.ts`

## Environment Requirements
Expected in `.env` or `.env.local`:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_POSTERS_BUCKET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `ADMIN_EMAILS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Safe First Steps In A New Session
1. Read `context.md`
2. Read `spec.md`
3. Read `supabase/schema.sql`
4. Check `src/app/admin/page.tsx` and the relevant API route before changing behavior
5. Run `npm run lint` before ending work

## Good First Prompt In A New Chat
Use this summary:

"This is a Next.js TypeScript poster ordering app with two live flows: CEER and AZURA. CEER uses file upload and download tracking in admin. AZURA uses Google Drive links, no downloaded state, and a printed toggle only. Admin login is Supabase-auth protected and filtered by allowed admin emails. Read `context.md`, `spec.md`, and `supabase/schema.sql` before making changes."