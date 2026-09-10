# Vonkzy

AI that recovers missed roofing leads.

When a homeowner fills out the roofing company's website contact form, Vonkzy instantly texts them back, asks a short set of qualifying questions, and books the inspection on the contractor's calendar — before the lead goes to a competitor instead. When a call is missed, Vonkzy alerts the contractor directly so they can call back fast; it does not yet text the homeowner automatically on that trigger, since the legal basis for that specific case is still unresolved (see `CLAUDE.md`).

## Status

Pre-launch, pre-revenue — but genuinely real now, not just a plan. The backend is live on the internet, secured, and tested. Real Google Calendar booking is built. **A contractor can actually sign up, log in, and see a page confirming it — real authentication, tested end to end with a real account.** What's left: the actual dashboard content (leads, bookings, ROI numbers), the real phone number, and the free pilot.

**Live right now:**
- Frontend: https://vonkzy.vercel.app
- Backend: https://vonkzy.onrender.com
- Sign up: https://vonkzy.vercel.app/signup
- Log in: https://vonkzy.vercel.app/login

## The core rule this product is built around

Most of the lost lead-conversion in roofing comes from missed phone calls, not just slow web-form replies — see `CLAUDE.md` for the full reasoning and the sourced evidence behind it.

## Tech stack

- **Backend (live logic):** Node.js / Express — handles incoming Twilio webhooks and calls Claude in real time. **Deployed and live on Render.**
- **Database:** Supabase — stores conversations, leads, bookings, and customer data. **Row-level security (RLS) is enabled with real policies** — a contractor can only ever see their own data. (See CLAUDE.md for a real incident where this was briefly, incorrectly disabled, then properly fixed.)
- **Authentication:** Supabase Auth — **done, live.** Real signup and login, linked to each contractor's own record.
- **AI:** Anthropic Claude API — Haiku only, on purpose, to keep costs minimal and predictable. A `MOCK_AI=true` setting exists in `.env` to test everything else for free, without calling the real API.
- **Messaging:** Twilio (SMS, missed-call detection)
- **Calendar/booking:** Google Calendar API — **done.** Real availability checking (skips weekends, finds genuine open slots), not a placeholder. A `MOCK_CALENDAR=true` setting exists for testing without needing real Google Cloud credentials yet.
- **Payments:** Paddle (Merchant of Record — no US LLC, no Stripe account needed)
- **Frontend:** Next.js/React, hosted on Vercel — live now, including real `/signup`, `/login`, and a placeholder `/dashboard`
- **Security:** Helmet.js, express-rate-limit, Twilio signature verification (built, off by default until Phase 9) — all **done, live.** Altcha (bot protection) — still planned.
- **Dashboard UI (planned, Phase 8):** shadcn/ui + Tailwind, TanStack Table, React Hook Form + Zod

## Getting started

**Backend:**
```bash
git clone <this repo>
cd backend
npm install
cp .env.example .env
```

Fill in `.env` with:
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `ANTHROPIC_API_KEY`, `MOCK_AI` (set `true` to test without spending on real AI calls)
- `TWILIO_VALIDATE` (leave `false` for local testing)
- `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`, `MOCK_CALENDAR` (set `true` to test without real Google Cloud setup)

Then: `npm start`

**Frontend:**
```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the **public** keys, safe for browser code, different from the backend's secret key.

Then: `npm run dev`

For Twilio to reach your local backend during development, use a tunnel (e.g. `ngrok http 3001`) and point the Twilio phone number's webhook URLs at the tunnel's address — or use the live Render URL directly once a real number exists (Phase 9).

## Project structure

```
frontend/
  pages/index.js         — the live marketing site
  pages/signup.js          — real signup, creates account + contractor record
  pages/login.js            — real login
  pages/dashboard.js         — placeholder confirming login works (real content: Phase 8)
  lib/supabaseClient.js       — frontend's public Supabase connection
backend/
  src/server.js         — routes, webhook entry points, security middleware
  src/ai.js               — Claude conversation logic and qualifying questions
  src/store.js              — reads and writes conversation/lead data to Supabase
  src/calendar.js             — real Google Calendar booking logic
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

## Known, deliberately deferred issues

Two separate moderate-severity `npm audit` findings — one inherited from Express 4.x, one from the `googleapis` package added in Phase 6. Neither has a safe automatic fix without real testing first. Full detail in `CLAUDE.md`. Low real risk with no live customer traffic yet, but must be revisited before Phase 10 (free pilot). Tracked, not ignored.

## Important — read before touching the messaging logic

Missed calls and missed forms are **not** handled the same way, on purpose — see `CLAUDE.md` for the full reasoning. Right now, missed calls alert the contractor only; they do not trigger an automated text to the homeowner. Do not add a homeowner-facing automated text to the missed-call flow without reading the consent section in `CLAUDE.md` first.
