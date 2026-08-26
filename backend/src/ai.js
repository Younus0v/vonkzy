// ai.js
// This is the actual "brain" — it decides what Vonkzy says next.
// Read CLAUDE.md before changing anything in here. The rules below aren't
// arbitrary — they come from real legal and product decisions made earlier.

const Anthropic = require("@anthropic-ai/sdk");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Two qualifying scripts — see CLAUDE.md for why these are different.
const TEMPLATES = {
  us_asphalt: `
You are texting on behalf of a US roofing company. Ask these questions ONE AT A TIME, in order,
never more than one question per message:
1. Repair or full replacement?
2. If repair: what's going on (leak, missing shingles, etc), then how old is the roof?
3. If replacement: storm/hail damage, or general wear and age?
   - If storm/hail: have they started an insurance claim yet?
   - If age/wear: how old is the roof?
4. Once you have enough info, offer to book an inspection.
`,
  flat_membrane: `
You are texting on behalf of a roofing/waterproofing company in a region with flat concrete or
membrane roofs (not US asphalt shingle). Ask these questions ONE AT A TIME:
1. Repair, or full waterproofing/re-coat?
2. If repair: what's going on (water coming through, ceiling staining, etc), then roughly how old
   is the current waterproofing membrane?
3. If full waterproofing: regular wear from heat/sun, or a specific cause (storm, nearby
   construction, plumbing issue)?
4. Ask who is making the decision — homeowner directly, or a building manager/landlord.
5. Once you have enough info, offer to book an inspection.
`,
};

const SYSTEM_PROMPT = (template, companyName) => `
You are an SMS assistant for ${companyName}, a roofing company. You are texting a homeowner who
either just missed a call from the company, or filled out the company's website contact form.

${TEMPLATES[template]}

CRITICAL SAFETY RULE — read this before every reply:
If the homeower's message suggests anything urgent or dangerous — an active leak, water actively
coming into the home, ceiling sagging, any safety concern — do NOT continue the normal questions.
Instead set "escalate" to true immediately. When in doubt, escalate. A false alarm costs nothing;
a missed real emergency is not acceptable. Bias toward escalating on anything ambiguous.

RULES:
- Never quote a price. Never make a warranty or material promise.
- Ask only ONE question per message. Keep messages short — this is a text message, not an email.
- Never claim certainty you don't have.
- Once you have enough info to book, set "ready_to_book" to true.

Respond ONLY with a JSON object, no other text, in this exact shape:
{
  "reply": "the text message to send back",
  "escalate": true or false,
  "ready_to_book": true or false,
  "extracted": { "job_type": "...", "roof_age": "...", "insurance_claim": true/false/null }
}
`;

// Takes the conversation so far and the newest homeowner message,
// returns the AI's decision as a parsed object.
async function getNextStep({ template, companyName, history, newMessage }) {
  const messages = history.map((m) => ({
    role: m.direction === "inbound" ? "user" : "assistant",
    content: m.body,
  }));
  messages.push({ role: "user", content: newMessage });

  // Haiku handles routine turns. If a reply ever looks ambiguous, this is the
  // spot to route to Sonnet instead — flagged here for that future upgrade.
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: SYSTEM_PROMPT(template, companyName),
    messages,
  });

  const raw = response.content[0].text;

  try {
    return JSON.parse(raw);
  } catch (err) {
    // If the model ever fails to return valid JSON, fail safe: escalate
    // rather than guess. Never let a parsing error silently drop a lead.
    console.error("AI response was not valid JSON:", raw);
    return {
      reply: "Thanks — let me have someone from our team follow up with you shortly.",
      escalate: true,
      ready_to_book: false,
      extracted: {},
    };
  }
}

module.exports = { getNextStep };
