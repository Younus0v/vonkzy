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

**Bias this toward false positives, deliberately.** A borderline or ambiguous message should trigger the alert, not get judged as probably-fine. Over-alerting is a tuning problem to fix later. Missing a real emergency is not recoverable. When in doubt, escalate.

## Call forwarding

Only forward the contractor's phone number to Vonkzy on no-answer or busy — never a full number swap. The business line must behave exactly as it did before whenever the contractor actually picks up. This is a deliberate design choice to reduce how big a setup step this feels like to a wary small-business owner.

## Missed calls, current pilot scope
A missed call does not trigger an automated text to the homeowner. It triggers an alert to the contractor instead — "You just missed a call from [number], call them back now." No automated consumer-facing message goes out on this trigger yet. The full AI qualifying conversation only runs on web-form leads, where consent is clearest.

## Path to eventually enabling the full homeowner-facing missed-call text
Not for the pilot. A real mechanism exists to eventually make this safe — a clear, prominent disclosure (voicemail greeting and/or right next to the phone number, not buried in a footer) stating something specific like "if we miss your call, we'll text you back to help — reply STOP to opt out," with a working STOP keyword Twilio actually honors. This can establish real prior consent, but only if it's genuinely prominent, specific, tied to the number called, and technically enforced — not just a policy line that exists somewhere.

The hard part isn't the legal mechanism, it's the rollout: this requires each contractor to actually update their own voicemail and disclosure, which Vonkzy can't fully verify happened. Before this is turned on for any customer: (1) a lawyer confirms the exact required wording and placement, and (2) a compliance step gets built into Vonkzy's own setup flow that requires the contractor to confirm and show the updated disclosure before the full AI flow is allowed to trigger on their missed calls — not just a checkbox, an actual verification step. Until both of those exist, missed calls stay on contractor-alert-only.

## Things the AI should never do

- Never quote a price or make a warranty/material promise.
- Never claim certainty it doesn't have — low-confidence replies should escalate to the owner rather than guess.
- Never send more than the necessary qualifying questions — the flow is: type of job (repair/replacement) → roof age → storm/insurance status → book. Keep it short; homeowners are on their phone, not filling out a form.

## Qualifying questions — two real templates, not one plus a promise

**US asphalt-shingle template:**
1. "Is this for a repair, or are you looking at a full replacement?"
2. If repair: "What's going on — a leak, missing shingles, or something else?" then "How old is the roof, roughly?"
3. If replacement: "Is this related to storm or hail damage, or more general wear and age?"
   - If storm/hail: "Have you already started a claim with your insurance company, or not yet?"
   - If age/wear: "How old is the current roof?"
4. Check calendar availability, offer times, confirm the booking.

**Flat concrete / membrane roof template (Gulf, Mediterranean, and similar markets) — first draft, unvalidated, same as the US script was before real testing:**
1. "Is this for a repair, or are you looking at full waterproofing or a re-coat?"
2. If repair: "What's going on — water coming through, ceiling staining, or something else?" then "Roughly how old is the current waterproofing membrane, if you know?"
3. If full waterproofing/replacement: "Is this regular wear from heat and sun, or was there a specific cause — storm, nearby construction, or a plumbing issue?"
4. No insurance-claim branch by default — that path doesn't apply the same way in these markets. Ask instead who's making the decision: the homeowner directly, or a building manager/landlord — this affects who the booking confirmation should go to.
5. Check calendar availability, offer times, confirm the booking.

This second template is a hypothesis, written now instead of left as a someday-item, specifically because it's the one differentiator that survived the last round of competitor research. It needs the same real-world testing the US version needs before it's trusted — don't treat it as more proven than the US script just because it's newer.

Both templates live in config, not hardcoded into the conversation flow, so adding a third (e.g. tile roofs, a different region) doesn't require touching the core logic.

## Known, tracked issue — not yet fixable

`npm audit` flags 3 moderate-severity vulnerabilities in `qs` (a dependency of `body-parser`,
used by `express`) — a denial-of-service risk in URL parsing. Confirmed as of this writing that
neither `npm audit fix` nor `npm audit fix --force` resolves it — the fix isn't released upstream
yet, not something wrong in this project's own code. Low real risk today since there's no public
traffic yet and rate limiting is already in place. **Re-run `npm audit` and check for a fix before
Phase 9 (real Twilio traffic) and before the pilot goes live** — don't let this get forgotten.

## Every message is visible, even though sending is automatic

The AI sends messages on its own, instantly, without the contractor approving each one first —
that's the entire point, since waiting for human approval would recreate the original slow-response
problem. But nothing is hidden: every message, in both directions, is saved to the `messages` table
the moment it happens, and the dashboard (Phase 8) shows the full conversation for every lead. Fast
and autonomous, but never invisible or unaccountable.

## Tone: warm and honest, never manipulative

The AI should sound like a genuinely attentive person, not a script — acknowledging what the
homeowner said, matching their tone, sounding calm and reassuring rather than clinical. This is a
deliberate improvement, not filler. It does NOT mean adding persuasion tactics: no manufactured
urgency, no guilt, no oversized enthusiasm to push a booking. If asked directly whether it's an AI,
it must answer honestly, never claim to be a human employee. Warmth builds trust; pressure destroys
it — don't blur that line when iterating on this later.

## Conversation history as a retention feature — not just data storage

Every message has been saved to Supabase since the very first version of this project — that part
already exists, it isn't new work. What's still missing is a real screen to browse it well. This
matters beyond just being useful: a contractor who can look back at months of real conversations,
bookings, and outcomes inside Vonkzy has a real reason not to switch to a competitor — leaving means
losing that history, not just switching a phone number. Treat the history view in Phase 8 as a
retention feature, not just a nice-to-have list.

Build the actual thread/timeline view using shadcn/ui components (already the dashboard's base) —
no need for a separate charting or chat library. For inspiration on how to lay out a clean
conversation-thread UI specifically, Chatwoot's inbox view (already noted elsewhere as a design
reference, not something to install) is the right thing to look at.

## Known, deliberately deferred issue

`npm audit` flags 3 moderate-severity vulnerabilities in `qs`/`body-parser`, inherited from Express
4.x itself — not something `npm audit fix` can resolve without a major-version jump to Express 5.
Low real risk right now (no live customer traffic yet), but this must be revisited and properly
fixed before Phase 10 (free pilot) goes live with real people. Not a silent gap — a known, tracked
item.

## Tech stack and conventions

- Node.js / Express for the live backend — this is what receives Twilio webhooks and calls Claude. Do not move this logic into Supabase Edge Functions; keep it a plain Node server, since that's the pattern Twilio's own docs and most reference examples use, which matters when debugging.
- Supabase for all data storage — conversations, leads, bookings, customers. All reads/writes to stored data go through `store.js`, not scattered across route handlers.
- Anthropic Claude API for the conversation logic — Haiku only, deliberately. Do not add Sonnet routing without checking with the founder first, since cost predictability was an explicit decision, not an oversight.
- Twilio for SMS and missed-call detection
- Google Calendar API for booking (first integration); other job-management tools (AccuLynx, JobNimbus, Housecall Pro) come later, via Zapier where there's no native integration yet
- Paddle for billing (Merchant of Record — handles payments and payout, no Stripe/LLC needed)
- Keep code simple and heavily commented — the founder is non-technical but hands-on, tests everything directly, and needs to be able to read and follow the code, not just run it.
- Favor small, single-purpose files over large ones. Avoid adding new dependencies unless there's a clear reason.

## Current stage

Pre-launch. No real users yet. The immediate goal is a working pilot version — the missed-call/form flow, the AI conversation, and the escalation rule — tested with 1-2 real roofing companies. Nothing beyond that (CRM export, multi-location, analytics dashboard) should be built yet. Resist scope creep — this has already been flagged once as a real risk for this project.
