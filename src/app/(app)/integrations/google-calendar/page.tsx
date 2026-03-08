import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { disconnectGoogleCalendar } from "@/lib/actions/integrations";
import { fetchUpcomingEvents } from "@/lib/google-calendar";

export default async function GoogleCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  if (!membership) redirect("/integrations");

  const { data: record } = await supabase
    .from("org_integrations")
    .select("status")
    .eq("organization_id", membership.organization_id)
    .eq("provider", "google_calendar")
    .single();

  const isConnected = record?.status === "connected";

  const events = isConnected
    ? await fetchUpcomingEvents(membership.organization_id)
    : null;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/integrations"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Integrations
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-3">
          Google Calendar
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Access calendar events to schedule and draft meeting content.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Connection status card */}
      <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Connection status
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {isConnected
                ? "Your Google Calendar is connected."
                : "Connect your Google Calendar to get started."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isConnected ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Connected
                </span>
                <form action={disconnectGoogleCalendar}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 rounded-md px-4 py-1.5 hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </form>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Not connected
                </span>
                <Link
                  href="/api/integrations/google-calendar/connect"
                  className="text-sm font-medium px-4 py-1.5 rounded-md border transition-colors border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Connect
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upcoming events */}
      {isConnected && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Upcoming events
          </h2>

          {events === null ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
              Could not fetch events. Try disconnecting and reconnecting.
            </div>
          ) : events.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
              No upcoming events found.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => {
                const startRaw =
                  event.start?.dateTime ?? event.start?.date ?? null;
                const startDate = startRaw ? new Date(startRaw) : null;

                return (
                  <div
                    key={event.id}
                    className="bg-white border border-gray-200 rounded-lg px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {event.summary ?? "(No title)"}
                        </p>
                        {startDate && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {startDate.toLocaleString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                      {event.htmlLink && (
                        <a
                          href={event.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-400 hover:text-gray-700 shrink-0 transition-colors"
                        >
                          Open ↗
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
