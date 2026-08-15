# Vonkzy

AI that recovers missed roofing leads.

When a homeowner calls a roofing company and nobody answers, or fills out the company's website contact form, Vonkzy instantly texts them back, asks a short set of qualifying questions, and books the inspection on the contractor's calendar — before the lead goes to a competitor instead.

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

- Starter — $199/month, up to 50 leads
- Pro — $399/month, up to 200 leads
- Growth — $699/month, unlimited leads
- First 10 customers — $99/month, locked in while continuously subscribed

## Important — read before touching the messaging logic

The missed-call flow and the web-form flow are **not** the same, on purpose — see `CLAUDE.md` for the consent reasoning. Do not make missed-call messages skip the opt-in step without understanding why it's there first.
