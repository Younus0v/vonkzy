// server.js
// The actual entry point. Three routes, matching the three ways a lead
// can start - see CLAUDE.md before changing the missed-call logic specifically.

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const store = require("./store");
const ai = require("./ai");
const calendar = require("./calendar");

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const webhookLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/webhooks", webhookLimiter);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const twilioValidation =
  process.env.TWILIO_VALIDATE === "true"
    ? twilio.webhook({ authToken: process.env.TWILIO_AUTH_TOKEN })
    : (req, res, next) => next();

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

app.post("/webhooks/missed-call", twilioValidation, async (req, res) => {
  try {
    const vonkzyNumber = req.body.To;
    const homeownerNumber = req.body.From;
    const callStatus = req.body.CallStatus;

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

    await sendText({
      to: contractor.owner_phone,
      from: contractor.phone_number,
      body: `You just missed a call from ${homeownerNumber}. Call them back now.`,
      leadId: lead?.id,
    });

    res.sendStatus(200);
  } catch (err) {
    console.error("missed-call webhook error:", err);
    res.sendStatus(200);
  }
});

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

app.post("/webhooks/sms", twilioValidation, async (req, res) => {
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
      const booking = await calendar.bookAppointment({
        leadId: lead.id,
        contractorId: contractor.id,
        calendarId: contractor.calendar_id,
        homeownerPhone: homeownerNumber,
        jobType: aiResult.extracted?.job_type,
      });
      await store.updateLead(lead.id, {
        booked_at: booking.booked ? new Date().toISOString() : null,
      });
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
