"use client";

import { useActionState } from "react";
import { generateCalendarBrief } from "@/lib/actions/calendar";
import type { CalendarEvent } from "@/lib/google-calendar";

const ACTIONS = [
  {
    value: "summarize-week",
    label: "Summarize my upcoming week",
    needsEvent: false,
  },
  {
    value: "draft-prep-brief",
    label: "Draft a prep brief for an event",
    needsEvent: true,
  },
  {
    value: "suggest-follow-ups",
    label: "Suggest follow-up tasks for an event",
    needsEvent: true,
  },
] as const;

type Action = (typeof ACTIONS)[number]["value"];

export function CalendarBriefForm({
  events,
}: {
  events: CalendarEvent[];
}) {
  const [state, formAction, isPending] = useActionState(
    generateCalendarBrief,
    undefined
  );

  // Determine selected action from the form state so we can show/hide event select.
  // We track it with a hidden input; the select onChange will update a sibling hidden field
  // via simple DOM, but it's easier to just always render the event select and disable it
  // when not needed. We'll use a controlled approach with useState.
  return (
    <CalendarBriefFormInner events={events} formAction={formAction} state={state} isPending={isPending} />
  );
}

import { useState } from "react";
import type { CalendarBriefState } from "@/lib/actions/calendar";

function CalendarBriefFormInner({
  events,
  formAction,
  state,
  isPending,
}: {
  events: CalendarEvent[];
  formAction: (payload: FormData) => void;
  state: CalendarBriefState;
  isPending: boolean;
}) {
  const [selectedAction, setSelectedAction] = useState<Action>("summarize-week");

  const needsEvent = ACTIONS.find((a) => a.value === selectedAction)?.needsEvent ?? false;

  return (
    <div>
      <form action={formAction} className="space-y-4">
        {/* Action selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            What would you like to generate?
          </label>
          <select
            name="action"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value as Action)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Event selector — shown only when the action requires a specific event */}
        {needsEvent && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Select an event
            </label>
            {events.length === 0 ? (
              <p className="text-sm text-gray-400">No upcoming events available.</p>
            ) : (
              <select
                name="event_id"
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                {events.map((event) => {
                  const startRaw =
                    event.start?.dateTime ?? event.start?.date ?? "";
                  const startLabel = startRaw
                    ? new Date(startRaw).toLocaleString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })
                    : "";
                  return (
                    <option key={event.id} value={event.id}>
                      {event.summary ?? "(No title)"}
                      {startLabel ? ` — ${startLabel}` : ""}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        )}

        {/* Error */}
        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending || (needsEvent && events.length === 0)}
          className="text-sm font-medium bg-gray-900 text-white px-5 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Generating…" : "Generate"}
        </button>
      </form>

      {/* Output */}
      {state?.output && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Result
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {state.output}
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Saved to{" "}
            <a href="/outputs" className="underline hover:text-gray-700">
              Outputs
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
