import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUpcomingEvents } from "@/lib/google-calendar";
import { CalendarBriefForm } from "@/components/app/calendar-brief-form";

function formatEventTime(
  start: { dateTime?: string; date?: string } | null,
  end: { dateTime?: string; date?: string } | null
): string {
  const startRaw = start?.dateTime ?? start?.date;
  const endRaw = end?.dateTime ?? end?.date;
  if (!startRaw) return "";

  const startDate = new Date(startRaw);

  // All-day event (date only, no time)
  if (start?.date && !start?.dateTime) {
    return startDate.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };
  const dayOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  const day = startDate.toLocaleDateString(undefined, dayOpts);
  const startTime = startDate.toLocaleTimeString(undefined, timeOpts);

  if (!endRaw) return `${day}, ${startTime}`;

  const endTime = new Date(endRaw).toLocaleTimeString(undefined, timeOpts);
  return `${day}, ${startTime} – ${endTime}`;
}

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (!membership) redirect("/dashboard");

  // Check if google_calendar is connected (reads org_integrations via RLS)
  const { data: integration } = await supabase
    .from("org_integrations")
    .select("status")
    .eq("organization_id", membership.organization_id)
    .eq("provider", "google_calendar")
    .single();

  const isConnected = integration?.status === "connected";

  if (!isConnected) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-assisted actions based on your calendar events.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Connect your Google Calendar to use this feature.
          </p>
          <Link
            href="/integrations/google-calendar"
            className="text-sm font-medium text-gray-900 underline"
          >
            Go to Integrations →
          </Link>
        </div>
      </div>
    );
  }

  // Fetch up to 10 upcoming events for the page (server-side, tokens never leave the server)
  const events = await fetchUpcomingEvents(membership.organization_id, 10);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          AI-assisted actions based on your upcoming events.
        </p>
      </div>

      {/* Upcoming events list */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-gray-700 mb-3">
          Upcoming events
        </h2>

        {events === null ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
            Could not load events.{" "}
            <Link
              href="/integrations/google-calendar"
              className="underline hover:text-gray-700"
            >
              Check your connection.
            </Link>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
            No upcoming events found.
          </div>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white border border-gray-200 rounded-lg px-5 py-3.5 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {event.summary ?? "(No title)"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatEventTime(event.start, event.end)}
                  </p>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {event.location}
                    </p>
                  )}
                </div>
                {event.htmlLink && (
                  <a
                    href={event.htmlLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-700 shrink-0 transition-colors pt-0.5"
                  >
                    Open ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI actions */}
      <section>
        <h2 className="text-sm font-medium text-gray-700 mb-3">AI actions</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <CalendarBriefForm events={events ?? []} />
        </div>
      </section>
    </div>
  );
}
