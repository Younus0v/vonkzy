// server.js
// The actual entry point. Three routes, matching the three ways a lead
// can start — see CLAUDE.md before changing the missed-call logic specifically.

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const store = require("./store");
const ai = require("./ai");
const calendar = require("./calendar");

const app = express();
app.use(bodyParser.urlencoded({ extended: false })); // Twilio sends this format
app.use(bodyParser.json()); // for the form webhook, sent as JSON

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Small helper — every outbound text goes through here so it's always
// saved to Supabase, never sent without a record of it.
async function sendText({ to, from, body, leadId }) {
  const message = await twilioClient.messages.create({ to, from, body });
  await store.saveMessage({
    leadId,
    direction: "outbound",
    body,
    fromNumber: from,
    toNumber: to,
    twilioSid: message.sid,
  });
  return message;
}

// ---------------------------------------------------------------------
// 1. MISSED CALL
// Per CLAUDE.md: this alerts the CONTRACTOR only. It does not text the
// homeowner automatically — that consent question isn't resolved yet.
// ---------------------------------------------------------------------
app.post("/webhooks/missed-call", async (req, res) => {
  try {
    const vonkzyNumber = req.body.To;
    const homeownerNumber = req.body.From;
    const callStatus = req.body.CallStatus; // e.g. 'no-answer', 'busy'

    // Only act on calls that actually went unanswered — not ones that
    // connected fine.
    if (!["no-answer", "busy", "failed"].includes(callStatus)) {
      return res.sendStatus(200);
    }

    const contractor = await store.getContractorByNumber(vonkzyNumber);
    if (!contractor) {
      console.error("No contractor found for number:", vonkzyNumber);
      return res.sendStatus(200);
    }

    const lead = await store.createLead({
      contractorId: contractor.id,
      homeownerPhone: homeownerNumber,
      source: "missed_call",
    });

    // Alert the contractor directly — this is the whole action for now.
    await sendText({
      to: contractor.owner_phone,
      from: contractor.phone_number,
      body: `You just missed a call from ${homeownerNumber}. Call them back now.`,
      leadId: lead?.id,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("missed-call webhook error:", err);
    res.sendStatus(200); // still 200 so Twilio doesn't retry endlessly
  }
});

// ---------------------------------------------------------------------
// 2. WEB FORM SUBMITTED
// The homeowner already opted in by submitting the form, so the full AI
// qualifying conversation can start right away.
// Expects JSON body: { contractorPhoneNumber, homeownerPhone }
// ---------------------------------------------------------------------
app.post("/webhooks/form", async (req, res) => {
  try {
    const { contractorPhoneNumber, homeownerPhone } = req.body;

    const contractor = await store.getContractorByNumber(contractorPhoneNumber);
    if (!contractor) {
      return res.status(404).json({ error: "Unknown contractor number" });
    }

    const lead = await store.createLead({
      contractorId: contractor.id,
      homeownerPhone,
      source: "web_form",
    });

    const template = contractor.qualifying_template || "us_asphalt";
    const aiResult = await ai.getNextStep({
      template,
      companyName: contractor.company_name,
      history: [],
      newMessage: "[homeowner just submitted the website contact form]",
    });

    await sendText({
      to: homeownerPhone,
      from: contractor.phone_number,
      body: aiResult.reply,
      leadId: lead.id,
    });

    await store.updateLead(lead.id, { status: "active" });

    res.sendStatus(200);
  } catch (err) {
    console.error("form webhook error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ---------------------------------------------------------------------
// 3. INCOMING SMS REPLY
// Handles every text a homeowner sends back during an active conversation.
// ---------------------------------------------------------------------
app.post("/webhooks/sms", async (req, res) => {
  try {
    const vonkzyNumber = req.body.To;
    const homeownerNumber = req.body.From;
    const incomingBody = req.body.Body;

    const contractor = await store.getContractorByNumber(vonkzyNumber);
    if (!contractor) {
      console.error("No contractor found for number:", vonkzyNumber);
      return res.sendStatus(200);
    }

    const lead = await store.findOpenLead(contractor.id, homeownerNumber);
    if (!lead) {
      // No active conversation matches this reply. For now, just log it —
      // a real "unmatched inbound text" flow is a TODO for a later phase.
      console.log("Unmatched inbound message from", homeownerNumber);
      return res.sendStatus(200);
    }

    await store.saveMessage({
      leadId: lead.id,
      direction: "inbound",
      body: incomingBody,
      fromNumber: homeownerNumber,
      toNumber: vonkzyNumber,
    });

    const history = await store.getMessageHistory(lead.id);
    const template = contractor.qualifying_template || "us_asphalt";

    const aiResult = await ai.getNextStep({
      template,
      companyName: contractor.company_name,
      history,
      newMessage: incomingBody,
    });

    if (aiResult.escalate) {
      await sendText({
        to: contractor.owner_phone,
        from: contractor.phone_number,
        body: `Urgent: possible emergency from ${homeownerNumber}. They said: "${incomingBody}". Please call them directly.`,
        leadId: lead.id,
      });
      await store.updateLead(lead.id, { status: "escalated", urgent: true });
      return res.sendStatus(200);
    }

    await sendText({
      to: homeownerNumber,
      from: vonkzyNumber,
      body: aiResult.reply,
      leadId: lead.id,
    });

    await store.updateLead(lead.id, {
      ...aiResult.extracted,
      status: aiResult.ready_to_book ? "booked" : "active",
    });

    if (aiResult.ready_to_book) {
      await calendar.bookAppointment({ leadId: lead.id, contractorId: contractor.id });
      await store.updateLead(lead.id, { booked_at: new Date().toISOString() });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("sms webhook error:", err);
    res.sendStatus(200);
  }
});

app.get("/", (req, res) => {
  res.send("Vonkzy backend is running.");
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Vonkzy backend listening on port ${PORT}`);
});
