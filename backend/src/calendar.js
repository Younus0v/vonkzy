// calendar.js
// Real Google Calendar booking. Uses a Service Account, not a full OAuth
// "sign in with Google" flow - simpler setup: just share a calendar with
// the service account's email once, no consent screens, no redirect URLs.

const { google } = require("googleapis");

function getCalendarClient() {
  const auth = new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 || "", "base64").toString("utf8"),
    ["https://www.googleapis.com/auth/calendar"]
  );
  return google.calendar({ version: "v3", auth });
}

async function findNextAvailableSlot(calendar, calendarId) {
  const now = new Date();
  const searchEnd = new Date(now);
  searchEnd.setDate(searchEnd.getDate() + 5);

  const freebusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: searchEnd.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busy = freebusy.data.calendars[calendarId]?.busy || [];

  for (let day = 0; day < 7; day++) {
    const date = new Date(now);
    date.setDate(date.getDate() + day + 1);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    for (let hour = 9; hour < 17; hour++) {
      const slotStart = new Date(date);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1);

      const overlaps = busy.some((b) => {
        const busyStart = new Date(b.start);
        const busyEnd = new Date(b.end);
        return slotStart < busyEnd && slotEnd > busyStart;
      });

      if (!overlaps && slotStart > now) {
        return { start: slotStart, end: slotEnd };
      }
    }
  }

  const fallbackStart = new Date(now);
  fallbackStart.setDate(fallbackStart.getDate() + 3);
  while (fallbackStart.getDay() === 0 || fallbackStart.getDay() === 6) {
    fallbackStart.setDate(fallbackStart.getDate() + 1);
  }
  fallbackStart.setHours(10, 0, 0, 0);
  const fallbackEnd = new Date(fallbackStart);
  fallbackEnd.setHours(11, 0, 0, 0);
  return { start: fallbackStart, end: fallbackEnd };
}

async function bookAppointment({ leadId, contractorId, calendarId, homeownerPhone, jobType }) {
  if (process.env.MOCK_CALENDAR === "true") {
    console.log("[MOCK_CALENDAR] Skipping real Google Calendar call.");
    const fakeTime = new Date();
    fakeTime.setDate(fakeTime.getDate() + 2);
    return { booked: true, time: fakeTime.toISOString(), mock: true };
  }

  if (!calendarId) {
    console.error("bookAppointment: no calendarId set for this contractor");
    return { booked: false, error: "No calendar connected yet" };
  }

  try {
    const calendar = getCalendarClient();
    const slot = await findNextAvailableSlot(calendar, calendarId);

    const event = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `Roofing inspection - ${jobType || "lead from Vonkzy"}`,
        description: `Booked automatically by Vonkzy. Homeowner: ${homeownerPhone}. Lead ID: ${leadId}`,
        start: { dateTime: slot.start.toISOString() },
        end: { dateTime: slot.end.toISOString() },
      },
    });

    return { booked: true, time: slot.start.toISOString(), eventId: event.data.id };
  } catch (err) {
    console.error("bookAppointment error:", err.message);
    return { booked: false, error: err.message };
  }
}

module.exports = { bookAppointment };
