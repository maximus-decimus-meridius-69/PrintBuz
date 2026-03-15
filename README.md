# Poster Desk

Next.js application with two customer sections:

- `AZURA`: reserved for a future release.
- `CEER`: active poster submission flow with file upload, Razorpay checkout, Supabase persistence, admin listing, and email confirmation.

## Features

- Customer landing page with AZURA placeholder and CEER upload form
- Fixed poster price at Rs. 150
- Poster file upload after payment verification
- Razorpay order creation and signature verification
- Supabase table and storage integration
- Admin login route with email allow-list protection
- Admin order view with sorting by sequence, year, department, and course
- SMTP-based confirmation email after successful payment

## Stack

- Next.js App Router with TypeScript
- Tailwind CSS v4
- Supabase for database, auth, and storage
- Razorpay for payments
- Nodemailer for confirmation emails

## Environment variables

Copy `.env.example` to `.env.local` and set the values.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_POSTERS_BUCKET=posters
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
ADMIN_EMAILS=admin@example.com
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Poster Desk <noreply@example.com>
```

## Supabase setup

1. Create a Supabase project.
2. Open SQL Editor and run the SQL in `supabase/schema.sql`.
3. Copy these values from Project Settings -> API into `.env.local`:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `SUPABASE_SERVICE_ROLE_KEY`
4. In Authentication -> Users, create at least one admin user with email and password.
5. Put that admin email into `ADMIN_EMAILS` in `.env.local` when you are ready to restrict admin access.
6. The SQL script also creates the public `posters` bucket expected by the app.

The app uses the service role key on the server to write payment-verified orders and upload posters.

For local testing, if email confirmation is enabled in Supabase Auth, either confirm the admin user from the dashboard or disable email confirmation temporarily.

## Run locally

```bash
npm install
npm run dev
```

The project uses separate Next.js output directories for development and production builds so a running dev server is not corrupted by `npm run build`.

## Payment flow

1. Customer fills the CEER form and selects a poster file.
2. `/api/create-order` creates a pending record and requests a Razorpay order.
3. Razorpay checkout opens for Rs. 150.
4. `/api/payment/verify` verifies the signature, uploads the poster to Supabase storage, marks the order as paid, and sends the confirmation email.
5. Admin views paid orders at `/admin`.

## Admin access

- `/admin/login` handles sign-in through Supabase Auth.
- `/admin` is guarded by middleware and a server-side email allow-list check.
- Non-admin users are blocked even if they have a valid Supabase session.

## Notes

- The AZURA section is intentionally left empty except for a coming-soon placeholder.
- For poster previews in admin, the Supabase storage bucket should be public. If you want private files later, replace the public URL approach with signed URLs.# PrintBuz
