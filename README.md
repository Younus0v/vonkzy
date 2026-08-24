# Vonkzy

AI that recovers missed roofing leads.

When a homeowner fills out the roofing company's website contact form, Vonkzy instantly texts them back, asks a short set of qualifying questions, and books the inspection on the contractor's calendar — before the lead goes to a competitor instead. When a call is missed, Vonkzy alerts the contractor directly so they can call back fast; it does not yet text the homeowner automatically on that trigger, since the legal basis for that specific case is still unresolved (see `CLAUDE.md`).

## Status

Early development. Pre-launch, pre-revenue. Building the core pilot version — one working flow, tested with a small number of real roofing companies, before anything else gets added.

## The core rule this product is built around

Most of the lost lead-conversion in roofing comes from missed phone calls, not just slow web-form replies — see `CLAUDE.md` for the full reasoning and the sourced evidence behind it.

## Tech stack

- **Backend (live logic):** Node.js / Express — handles incoming Twilio webhooks and calls Claude in real time. Hosted on Render or Railway.
- **Database:** Supabase — stores conversations, leads, bookings, and customer data. Its built-in table view also works as a basic dashboard early on, before a custom one is built.
- **AI:** Anthropic Claude API (Haiku for routine replies, Sonnet for anything ambiguous or low-confidence)
- **Messaging:** Twilio (SMS, missed-call detection)
- **Calendar/booking:** Google Calendar API to start; job-management tool integrations (AccuLynx, JobNimbus, Housecall Pro) added later, via Zapier where no native integration exists
- **Payments:** Stripe
- **Frontend (later):** hosted on Vercel

## Getting started

```bash
git clone <this repo>
cd vonkzy-app
npm install
cp .env.example .env
```

Fill in `.env` with:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_KEY`

Then:
```bash
npm run dev
```

For Twilio to reach your local machine during development, use a tunnel (e.g. `ngrok http 3000`) and point the Twilio phone number's webhook URLs at the tunnel's address.

## Project structure (planned)

```
src/
  server.js          — routes and webhook entry points
  ai.js              — Claude conversation logic and qualifying questions
  store.js           — reads and writes conversation/lead data to Supabase
  calendar.js         — booking logic (Google Calendar first, others later)
webhooks/
  missed-call         — fires on an unanswered call, sends the opt-in message
  sms                 — handles every incoming text, runs the AI conversation
  form                 — fires on a website contact-form submission
```

## Pricing (for reference — not part of the app yet)

- Starter — $199/month, up to 75 leads
- Pro — $399/month, up to 250 leads
- Growth — $699/month, unlimited leads
- First 10 customers — $99/month, locked in while continuously subscribed

## Payments
Vonkzy uses **Paddle** as its Merchant of Record. No US LLC, no Stripe account, no Mercury bank account required.

Full flow: customer pays by US credit card → Paddle processes instantly → balance batches on the 1st of each month → Paddle sends wire by the 15th → arrives in Alinma Bank (Saudi Arabia) roughly 2-5 business days later.

Real fees on a $199 payment:
- Paddle fee: 5% + $0.50 = ~$10.45
- SWIFT wire fee: $15 flat per monthly payout (splits across all customers that month)
- FX conversion margin: up to 1.5%
- You receive roughly $173-178 per $199 customer, per month

Saudi Arabia is a verified supported payout country per Paddle's official documentation.

## Important — read before touching the messaging logic

Missed calls and missed forms are **not** handled the same way, on purpose — see `CLAUDE.md` for the full reasoning. Right now, missed calls alert the contractor only; they do not trigger an automated text to the homeowner. Do not add a homeowner-facing automated text to the missed-call flow without reading the consent section in `CLAUDE.md` first — that part is gated behind a real legal review, not a design decision to make casually



