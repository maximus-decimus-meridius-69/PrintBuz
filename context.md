# Project Context

## What this project is
- Project name: Poster Desk
- Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Razorpay, Nodemailer
- Purpose: poster submission and admin management system with two customer sections:
  - CEER: live poster upload and payment flow
  - AZURA: coming soon placeholder

## Customer-facing routes
- `/`: minimal landing page with two boxes, AZURA and CEER
- `/ceer`: CEER poster submission form
- `/azura`: coming soon page

## Admin routes
- `/admin/login`: admin login with Supabase Auth
- `/admin`: admin dashboard

## Current customer flow
1. User opens `/ceer`
2. Fills form fields: roll number, department, year, course, email, section
3. Uploads poster file
4. Razorpay checkout opens for Rs. 150
5. On successful verification:
   - order is saved in Supabase
   - poster is uploaded to Supabase storage bucket `posters`
   - confirmation email is sent if SMTP is configured

## Current admin features
- Supabase-auth protected admin login
- Additional email allow-list via `ADMIN_EMAILS`
- Admin dashboard supports:
  - event tabs: `Ceer Orders`, `Azura Orders`
  - filters: Course, Department, Section, Year
  - print status checkbox
  - delete button
- Delete action also:
  - deletes the poster from Supabase storage
  - sends audit email to admin email list

## Important implementation details
- CEER orders are created with event = `ceer`
- AZURA order flow is not implemented yet
- Admin tabs exist for both CEER and AZURA, but AZURA will remain empty until its flow is added
- The app uses separate Next.js output directories to avoid dev/build corruption:
  - dev: `.next-dev`
  - build: `.next-build`

## Important files
- `src/app/page.tsx`: landing page
- `src/app/ceer/page.tsx`: CEER page
- `src/app/azura/page.tsx`: AZURA page
- `src/app/admin/page.tsx`: admin dashboard
- `src/app/admin/login/page.tsx`: admin login page
- `src/app/api/create-order/route.ts`: Razorpay order creation
- `src/app/api/payment/verify/route.ts`: payment verification and poster upload
- `src/app/api/admin/orders/delete/route.ts`: delete record + delete poster + audit email
- `src/app/api/admin/orders/print-status/route.ts`: toggle print status
- `src/lib/email.ts`: mail sending logic
- `src/lib/admin-auth.ts`: admin authorization helper
- `supabase/schema.sql`: database/storage setup

## Database expectations
Table: `poster_orders`
Expected columns include:
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
- `print_done`
- `poster_path`
- `poster_url`
- `razorpay_order_id`
- `razorpay_payment_id`
- `payment_verified_at`
- `created_at`

## Known compatibility fallback
- `create-order` has a fallback for older Supabase schemas where `event` is missing
- `admin` page also tolerates missing `event` and `print_done` by defaulting them in app code
- This is temporary compatibility logic, not the desired final state

## What still must be done in Supabase
Run the latest `supabase/schema.sql` in the real Supabase project so these columns definitely exist:
- `event`
- `print_done`

## Environment requirements
Expected in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `ADMIN_EMAILS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

## Known issue history
- The project previously had recurring Next.js chunk errors like `Cannot find module './543.js'`
- Root cause: dev and build used the same `.next` output
- Fixed by separating output directories in `package.json` and `next.config.ts`

## Current UI direction
- Client-facing copy has been simplified and most internal/explanatory text was removed
- Home page is intentionally minimal
- CEER page is focused on the form
- Admin selected event tabs use a light amber highlight instead of dark black fill

## Good first message in a new chat
Use this summary:

"This is a Next.js TypeScript poster submission project called Poster Desk. CEER flow is live, AZURA is placeholder-only. Supabase handles auth/database/storage, Razorpay handles payment, SMTP sends emails. Admin has login, filters, print checkbox, delete with poster cleanup, and CEER/AZURA order tabs. Please read `context.md`, `README.md`, and `supabase/schema.sql` before making changes."