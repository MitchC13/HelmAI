import { getAccessToken } from "@/lib/oauth-tokens";

export type CalendarEvent = {
  id: string;
  summary: string | null;
  description: string | null;
  location: string | null;
  start: { dateTime?: string; date?: string } | null;
  end: { dateTime?: string; date?: string } | null;
  attendees: { email: string; displayName?: string }[] | null;
  htmlLink: string | null;
};

const PROVIDER = "google_calendar";

/** Fetches the next `limit` upcoming events from the org's primary calendar. */
export async function fetchUpcomingEvents(
  orgId: string,
  limit = 5
): Promise<CalendarEvent[] | null> {
  const accessToken = await getAccessToken(orgId, PROVIDER);
  if (!accessToken) return null;

  const params = new URLSearchParams({
    maxResults: String(limit),
    orderBy: "startTime",
    singleEvents: "true",
    timeMin: new Date().toISOString(),
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return (data.items ?? []) as CalendarEvent[];
}

/** Fetches a single event by ID from the org's primary calendar. */
export async function fetchSingleEvent(
  orgId: string,
  eventId: string
): Promise<CalendarEvent | null> {
  const accessToken = await getAccessToken(orgId, PROVIDER);
  if (!accessToken) return null;

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return null;

  return res.json() as Promise<CalendarEvent>;
}
