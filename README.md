# Swim Lessons with Natalie — Booking App

A small Next.js web app for booking Natalie's private swimming lessons in her
backyard pool. Customers pick an open time and book with their name + phone;
Natalie logs in to publish available times and see her bookings.

- **$60 per 30-minute lesson** · paid in cash or Venmo at the lesson
- Glen Rock, NJ · big private backyard pool (50 ft × 25 ft)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

- **Customer site:** `/` — marketing page + booking.
- **Owner dashboard:** `/owner` — log in with the password to add/remove time
  slots and view who has booked.

## Tests

```bash
createdb swim_test   # one-time: a throwaway Postgres database for tests
npm test             # run once
npm run test:watch   # watch mode
```

[Vitest](https://vitest.dev) covers four areas (`tests/`):

- **`db.test.ts`** — the full booking lifecycle against a real Postgres database
  (`swim_test`): add/remove slots, availability filtering, booking, the
  double-booking guard, confirm, and cancel. Override the database with
  `TEST_DATABASE_URL` if your local Postgres uses a non-default user/host.
- **`routes.test.ts`** — API route logic (validation, auth gating, confirm/cancel
  action routing) with the database and email layers mocked.
- **`notify.test.ts`** — email notifications, with `fetch` mocked to assert the
  Resend calls (recipients, wording) and the no-op-when-unconfigured behavior.
- **`format.test.ts`** — date/time formatting helpers.

### Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs on every push to `main`
and on pull requests. It spins up a Postgres 16 service container, points the tests
at it via `TEST_DATABASE_URL`, then runs `npm test` and `npm run build`.

## Configuration

Copy `.env.example` to `.env.local` and set:

| Variable             | Required | What it does                                                     |
| -------------------- | -------- | ---------------------------------------------------------------- |
| `DATABASE_URL`       | ✅       | Postgres connection string (any Postgres; Neon on Vercel).       |
| `OWNER_PASSWORD`     | ✅       | Password for the `/owner` dashboard (default `natalie2026`).      |
| `SESSION_SECRET`     | ✅       | Random string used to sign the login cookie.                     |
| `RESEND_API_KEY`     |          | Resend API key — enables email notifications.                    |
| `EMAIL_FROM`         |          | Verified sender, e.g. `Natalie's Swim Lessons <bookings@…>`.     |
| `OWNER_EMAIL`        |          | Natalie's email — gets a message on every new booking.           |

## How it works

- Booking data is stored in **Postgres** (`lib/db.ts`, via the `postgres` driver).
  The `slots` table is created automatically on first use. Bookings are guarded by
  an atomic `UPDATE … WHERE booking_name IS NULL` so a slot can't be double-booked.
- Owner-only routes are gated by an HMAC-signed session cookie (`lib/auth.ts`).
- **Booking approval flow:** when a customer books, the slot becomes **pending** —
  it's held (no one else can take it) but not finalized. From her dashboard Natalie
  can **Confirm** it (→ confirmed), **Decline** a pending request, or **Cancel** a
  confirmed lesson. Declining/cancelling reopens the time for others to book.
- **Email notifications** (`lib/notify.ts`): on a new booking, Natalie gets a
  "new lesson request" email (with name/phone/time) and the customer gets a
  "request received" email. When Natalie confirms, the customer gets a
  "you're confirmed" email; when she declines/cancels, the customer gets a
  cancellation email (tailored to whether it was pending or confirmed). Optional
  customer email; sent via Resend's REST API. If Resend env vars are unset, the
  messages are logged to the server console instead — so the app works without it.

## Database setup

**Local:** point `DATABASE_URL` at any Postgres, e.g.

```bash
createdb swim
# DATABASE_URL=postgres://<you>@localhost:5432/swim
```

**Vercel:** add a **Neon Postgres** database from the Vercel Marketplace
(Storage tab). It sets `DATABASE_URL` automatically. Then set `OWNER_PASSWORD`,
`SESSION_SECRET`, and the optional `RESEND_API_KEY` / `EMAIL_FROM` / `OWNER_EMAIL`
vars in the project's Environment Variables, and deploy.

## Email setup (Resend)

Add **Resend** from the Vercel Marketplace (or sign up at resend.com), verify a
sending domain, create an API key, and set `RESEND_API_KEY`, `EMAIL_FROM` (an
address at your verified domain), and `OWNER_EMAIL` (Natalie's inbox).
