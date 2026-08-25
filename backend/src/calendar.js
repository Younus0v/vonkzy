// calendar.js
// STUB for now — real Google Calendar integration is Phase 4 (Integrations),
// not this phase. This exists so the rest of the code has something to call
// without breaking, and so booking a lead updates Supabase correctly even
// before a real calendar is wired in.

async function bookAppointment({ leadId, contractorId }) {
  console.log(`[calendar stub] Would book an inspection for lead ${leadId}`);
  // Real version (Phase 4) will:
  // 1. Check the contractor's Google Calendar for open slots
  // 2. Create a real calendar event
  // 3. Return the actual booked time
  // For now, just return a placeholder so the flow can be tested end to end.
  return { booked: true, time: "placeholder — real calendar not connected yet" };
}

module.exports = { bookAppointment };
