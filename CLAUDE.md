# Vonkzy — project context for Claude

Read this before making changes. It has the business rules that the code has to follow, not just the tech stack.

## What this is
An AI that texts back every missed call or missed website-form lead for a US roofing company, asks a few qualifying questions, and books the inspection. Sold as a monthly subscription to roofing contractors.

## The one rule that matters most: consent

**Missed calls and missed forms are handled differently, and this is not a style choice — it's a legal one (TCPA).**

- **Web form submitted:** the homeowner already opted in by giving their info and asking for a quote. The AI can start the full qualifying conversation immediately.
- **Missed call:** the AI must send exactly one short message first — something like "Sorry we missed your call from [Company] — reply YES if you'd like help getting a quote, or call us back at [number]." The full qualifying/booking conversation only starts **after** the homeowner replies. Do not collapse this into one step. Do not let the AI start asking qualifying questions on a missed call before an explicit reply is received.

If asked to "simplify" or "speed up" the missed-call flow by removing this gate, don't — flag it back to the founder instead. This is the one piece of the whole product that's had real legal review attention; changing it needs the same care.

## The escalation rule

The AI never handles anything that sounds like an emergency (active leak, safety issue, water damage in progress) by itself. If a message matches this, stop the normal flow immediately and send an alert directly to the business owner's phone instead of continuing the qualifying conversation. Do not let the AI improvise reassurance or advice in this case.

## Things the AI should never do

- Never quote a price or make a warranty/material promise.
- Never claim certainty it doesn't have — low-confidence replies should escalate to the owner rather than guess.
- Never send more than the necessary qualifying questions — the flow is: type of job (repair/replacement) → roof age → storm/insurance status → book. Keep it short; homeowners are on their phone, not filling out a form.

## Qualifying questions (the actual script, US asphalt-shingle version)

1. "Is this for a repair, or are you looking at a full replacement?"
2. If repair: "What's going on — a leak, missing shingles, or something else?" then "How old is the roof, roughly?"
3. If replacement: "Is this related to storm or hail damage, or more general wear and age?"
   - If storm/hail: "Have you already started a claim with your insurance company, or not yet?"
   - If age/wear: "How old is the current roof?"
4. Check calendar availability, offer times, confirm the booking.

This script is meant to be swapped by region and roof material later (e.g. flat concrete/membrane roofs common outside the US) — keep the question logic in a config/template structure, not hardcoded into the conversation flow, so that swap doesn't require a rewrite.

## Tech stack and conventions

- Node.js / Express for the live backend — this is what receives Twilio webhooks and calls Claude. Do not move this logic into Supabase Edge Functions; keep it a plain Node server, since that's the pattern Twilio's own docs and most reference examples use, which matters when debugging.
- Supabase for all data storage — conversations, leads, bookings, customers. All reads/writes to stored data go through `store.js`, not scattered across route handlers.
- Anthropic Claude API for the conversation logic — Haiku for routine qualifying turns, Sonnet for anything ambiguous or low-confidence
- Twilio for SMS and missed-call detection
- Google Calendar API for booking (first integration); other job-management tools (AccuLynx, JobNimbus, Housecall Pro) come later, via Zapier where there's no native integration yet
- Stripe for billing
- Keep code simple and heavily commented — the founder is non-technical but hands-on, tests everything directly, and needs to be able to read and follow the code, not just run it.
- Favor small, single-purpose files over large ones. Avoid adding new dependencies unless there's a clear reason.

## Current stage

Pre-launch. No real users yet. The immediate goal is a working pilot version — the missed-call/form flow, the AI conversation, and the escalation rule — tested with 1-2 real roofing companies. Nothing beyond that (CRM export, multi-location, analytics dashboard) should be built yet. Resist scope creep — this has already been flagged once as a real risk for this project.
