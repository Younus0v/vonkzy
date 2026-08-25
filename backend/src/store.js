// store.js
// Every read/write to Supabase goes through here — nothing else in the app
// should talk to Supabase directly. Keeps the database logic in one place.

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Find the contractor that owns a given Vonkzy phone number.
async function getContractorByNumber(phoneNumber) {
  const { data, error } = await supabase
    .from("contractors")
    .select("*")
    .eq("phone_number", phoneNumber)
    .single();

  if (error) {
    console.error("getContractorByNumber error:", error.message);
    return null;
  }
  return data;
}

// Find an existing open lead for this homeowner + contractor, if one exists.
// A lead counts as "open" if it hasn't been booked or marked lost yet.
async function findOpenLead(contractorId, homeownerPhone) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("contractor_id", contractorId)
    .eq("homeowner_phone", homeownerPhone)
    .in("status", ["new", "active"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("findOpenLead error:", error.message);
    return null;
  }
  return data;
}

// Create a new lead — either from a missed call or a web form submission.
async function createLead({ contractorId, homeownerPhone, source }) {
  const { data, error } = await supabase
    .from("leads")
    .insert({
      contractor_id: contractorId,
      homeowner_phone: homeownerPhone,
      source, // 'missed_call' or 'web_form'
      status: "new",
    })
    .select()
    .single();

  if (error) {
    console.error("createLead error:", error.message);
    return null;
  }
  return data;
}

// Update a lead as the conversation progresses (qualifying answers, status, etc).
async function updateLead(leadId, fields) {
  const { data, error } = await supabase
    .from("leads")
    .update(fields)
    .eq("id", leadId)
    .select()
    .single();

  if (error) {
    console.error("updateLead error:", error.message);
    return null;
  }
  return data;
}

// Save every message, in either direction, tied to its lead.
async function saveMessage({ leadId, direction, body, fromNumber, toNumber, twilioSid }) {
  const { error } = await supabase.from("messages").insert({
    lead_id: leadId,
    direction, // 'inbound' or 'outbound'
    body,
    from_number: fromNumber,
    to_number: toNumber,
    twilio_sid: twilioSid || null,
  });

  if (error) {
    console.error("saveMessage error:", error.message);
  }
}

// Get the full message history for a lead, oldest first —
// this is what gets sent to Claude as conversation context.
async function getMessageHistory(leadId) {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getMessageHistory error:", error.message);
    return [];
  }
  return data;
}

module.exports = {
  getContractorByNumber,
  findOpenLead,
  createLead,
  updateLead,
  saveMessage,
  getMessageHistory,
};
