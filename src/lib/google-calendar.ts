import { createAdminClient } from "@/lib/supabase/admin";

type TokenRow = {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
};

type CalendarEvent = {
  id: string;
  summary: string | null;
  start: { dateTime?: string; date?: string } | null;
  end: { dateTime?: string; date?: string } | null;
  htmlLink: string | null;
};

async function refreshAccessToken(
  orgId: string,
  refreshToken: string
): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const { access_token, expires_in } = data;
  if (!access_token) return null;

  const tokenExpiresAt = new Date(
    Date.now() + (expires_in ?? 3600) * 1000
  ).toISOString();

  const admin = createAdminClient();
  await admin
    .from("integration_tokens")
    .update({ access_token, token_expires_at: tokenExpiresAt })
    .eq("organization_id", orgId)
    .eq("provider", "google_calendar");

  return access_token;
}

export async function fetchUpcomingEvents(
  orgId: string
): Promise<CalendarEvent[] | null> {
  const admin = createAdminClient();

  const { data: tokenRow } = await admin
    .from("integration_tokens")
    .select("access_token, refresh_token, token_expires_at")
    .eq("organization_id", orgId)
    .eq("provider", "google_calendar")
    .single<TokenRow>();

  if (!tokenRow) return null;

  let accessToken = tokenRow.access_token;

  // Refresh if expired (or within 60 seconds of expiry)
  if (tokenRow.token_expires_at) {
    const expiresAt = new Date(tokenRow.token_expires_at).getTime();
    if (Date.now() >= expiresAt - 60_000 && tokenRow.refresh_token) {
      const refreshed = await refreshAccessToken(orgId, tokenRow.refresh_token);
      if (!refreshed) return null;
      accessToken = refreshed;
    }
  }

  const now = new Date().toISOString();
  const params = new URLSearchParams({
    maxResults: "5",
    orderBy: "startTime",
    singleEvents: "true",
    timeMin: now,
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) return null;

  const data = await res.json();
  return (data.items ?? []) as CalendarEvent[];
}
