# Vonkzy

AI that recovers missed roofing leads.

When a homeowner fills out the roofing company's website contact form, Vonkzy instantly texts them back, asks a short set of qualifying questions, and books the inspection on the contractor's calendar — before the lead goes to a competitor instead. When a call is missed, Vonkzy alerts the contractor directly so they can call back fast; it does not yet text the homeowner automatically on that trigger, since the legal basis for that specific case is still unresolved (see `CLAUDE.md`).

## Status

Early development. Pre-launch, pre-revenue. Backend is built and tested locally — real bugs found and fixed — but currently only runs on a developer's machine, not deployed anywhere permanent yet. That's the next real step, not a finished product waiting on customers.

## The core rule this product is built around

Most of the lost lead-conversion in roofing comes from missed phone calls, not just slow web-form replies — see `CLAUDE.md` for the full reasoning and the sourced evidence behind it.

## Tech stack

- **Backend (live logic):** Node.js / Express — handles incoming Twilio webhooks and calls Claude in real time. To be deployed on Render or Google Cloud Run (currently runs locally only).
- **Database:** Supabase — stores conversations, leads, bookings, and customer data. Auth and row-level security (RLS) also come from Supabase, not a separate tool.
- **AI:** Anthropic Claude API — Haiku only, on purpose, to keep costs minimal and predictable. A `MOCK_AI=true` setting exists in `.env` to test everything else for free, without calling the real API.
- **Messaging:** Twilio (SMS, missed-call detection)
- **Calendar/booking:** Google Calendar API to start; job-management tool integrations (AccuLynx, JobNimbus, Housecall Pro) added later, via Zapier where no native integration exists
- **Payments:** Paddle (Merchant of Record — no US LLC, no Stripe account needed)
- **Frontend:** Next.js/React, hosted on Vercel — live now
- **Dashboard UI (planned):** shadcn/ui + Tailwind, TanStack Table, React Hook Form + Zod
- **Security (planned):** Helmet.js, express-rate-limit, Altcha (bot protection)

## Getting started

```bash
git clone <this repo>
cd backend
npm install
cp .env.example .env
```

Fill in `.env` with:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ANTHROPIC_API_KEY`
- `MOCK_AI` (set to `true` to test without spending on real AI calls)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`

Then:
```bash
npm start
```

For Twilio to reach your local machine during development, use a tunnel (e.g. `ngrok http 3001`) and point the Twilio phone number's webhook URLs at the tunnel's address.

## Project structure

```
frontend/              — the live marketing site (Next.js)
backend/
  src/server.js         — routes and webhook entry points
  src/ai.js              — Claude conversation logic and qualifying questions
  src/store.js            — reads and writes conversation/lead data to Supabase
  src/calendar.js          — booking logic (placeholder — real Google Calendar comes in Phase 6)
supabase/                — SQL schema and migration files
```

## Pricing (for reference — not part of the app yet)

- Starter — $199/month, up to 75 leads
- Pro — $399/month, up to 250 leads
- Growth — $699/month, unlimited leads
- First 10 customers — $99/month, locked in while continuously subscribed

## Payments

Vonkzy uses **Paddle** as its Merchant of Record. No US LLC, no Stripe account, no Mercury bank account required.

Full flow: customer pays by US credit card → Paddle processes instantly → balance batches on the 1st of each month → Paddle sends payout by the 15th → paid out via **Payoneer** (not a wire transfer, so no SWIFT fee) → arrives in the Saudi bank account.

Real fees on a $199 payment:
- Paddle fee: 5% + $0.50 = ~$10.45
- Payoneer's own FX conversion margin (typically higher than Wise's — confirm the exact rate at signup, roughly 2-3% is a reasonable estimate)
- You receive roughly **$183-185** per $199 customer, per month — an estimate, not an exact confirmed number

Saudi Arabia is a verified supported payout country per Paddle's official documentation.

## On legal review

The missed-call consent design (see `CLAUDE.md`) was discussed informally, not reviewed by a specialist compliance lawyer. This is a known, accepted gap at this stage — not something to treat as fully resolved. The safer design (alerting the contractor instead of auto-texting the homeowner on a missed call) stays in place regardless, since it doesn't depend on that review to be the right call.

## Important — read before touching the messaging logic

Missed calls and missed forms are **not** handled the same way, on purpose — see `CLAUDE.md` for the full reasoning. Right now, missed calls alert the contractor only; they do not trigger an automated text to the homeowner. Do not add a homeowner-facing automated text to the missed-call flow without reading the consent section in `CLAUDE.md` first.
