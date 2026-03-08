"use server";

import Anthropic from "@anthropic-ai/sdk";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { fetchUpcomingEvents, fetchSingleEvent } from "@/lib/google-calendar";

export type CalendarBriefState =
  | { output?: string; error?: string }
  | undefined;

const ACTION_LABELS: Record<string, string> = {
  "summarize-week": "Weekly summary",
  "draft-prep-brief": "Prep brief",
  "suggest-follow-ups": "Follow-up tasks",
};

export async function generateCalendarBrief(
  _prevState: CalendarBriefState,
  formData: FormData
): Promise<CalendarBriefState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const action = (formData.get("action") as string | null) ?? "";
  const eventId = (formData.get("event_id") as string | null) || null;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (!membership) return { error: "No organization found." };
  const orgId = membership.organization_id;

  let systemPrompt: string;
  let userMessage: string;

  if (action === "summarize-week") {
    const events = await fetchUpcomingEvents(orgId, 10);
    if (!events) {
      return {
        error:
          "Could not fetch calendar events. Ensure Google Calendar is still connected.",
      };
    }
    if (events.length === 0) {
      return { error: "No upcoming events found to summarize." };
    }

    const eventsList = events
      .map((e, i) => {
        const start = e.start?.dateTime ?? e.start?.date ?? "unknown";
        const label = e.summary ?? "(No title)";
        return `${i + 1}. ${label} — ${new Date(start).toLocaleString()}`;
      })
      .join("\n");

    systemPrompt =
      "You are a thoughtful executive assistant. Write clear, concise summaries.";
    userMessage = `Summarize my upcoming week based on these calendar events:\n\n${eventsList}\n\nProvide a brief overview of the week ahead with key focus areas and any patterns you notice.`;
  } else if (action === "draft-prep-brief" || action === "suggest-follow-ups") {
    if (!eventId) return { error: "Please select an event." };

    const event = await fetchSingleEvent(orgId, eventId);
    if (!event) return { error: "Could not fetch the selected event." };

    const start = event.start?.dateTime ?? event.start?.date ?? "unknown";
    const end = event.end?.dateTime ?? event.end?.date ?? "unknown";
    const title = event.summary ?? "(No title)";

    const parts = [
      `Event: ${title}`,
      `Start: ${new Date(start).toLocaleString()}`,
      `End: ${new Date(end).toLocaleString()}`,
    ];
    if (event.location) parts.push(`Location: ${event.location}`);
    if (event.description) parts.push(`Description: ${event.description}`);
    if (event.attendees?.length) {
      parts.push(
        `Attendees: ${event.attendees.map((a) => a.displayName ?? a.email).join(", ")}`
      );
    }
    const eventContext = parts.join("\n");

    if (action === "draft-prep-brief") {
      systemPrompt =
        "You are a thoughtful executive assistant. Write concise, actionable meeting preparation briefs.";
      userMessage = `Write a preparation brief for this meeting:\n\n${eventContext}\n\nInclude: what to prepare in advance, key questions to raise, and any context worth researching beforehand.`;
    } else {
      systemPrompt =
        "You are a productive executive assistant. Suggest clear, actionable follow-up tasks.";
      userMessage = `Based on this upcoming event, suggest follow-up tasks to complete after it ends:\n\n${eventContext}\n\nList 3–5 specific, actionable tasks with brief explanations.`;
    }
  } else {
    return { error: "Unknown action selected." };
  }

  let output: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = message.content[0];
    if (block.type !== "text") return { error: "Unexpected response from AI." };
    output = block.text;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError)
      return { error: "API key is invalid. Check ANTHROPIC_API_KEY." };
    if (err instanceof Anthropic.RateLimitError)
      return { error: "Rate limit reached. Please try again in a moment." };
    if (err instanceof Anthropic.APIError)
      return { error: `Generation failed (${err.status}): ${err.message}` };
    return { error: "An unexpected error occurred." };
  }

  // Save to agent_runs — fits existing schema cleanly, no migration needed
  const label = ACTION_LABELS[action] ?? action;
  await supabase.from("agent_runs").insert({
    organization_id: orgId,
    user_id: user.id,
    agent_type: "calendar-brief",
    input: `[${label}] ${userMessage}`,
    output,
  });

  revalidatePath("/outputs");

  return { output };
}
