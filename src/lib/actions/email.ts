"use server";

import Anthropic from "@anthropic-ai/sdk";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { fetchEmailDetail } from "@/lib/gmail";

export type EmailActionState =
  | { output?: string; error?: string }
  | undefined;

const ACTIONS = {
  summarize: {
    label: "Summary",
    system:
      "You are a concise executive assistant. Summarize emails clearly and briefly.",
    prompt: (email: string) =>
      `Summarize this email in 2–4 sentences, capturing the main point and any key details:\n\n${email}`,
  },
  "draft-reply": {
    label: "Draft reply",
    system:
      "You are a professional assistant. Write clear, polite, and appropriately concise email replies.",
    prompt: (email: string) =>
      `Draft a professional reply to this email. Write only the reply body — no subject line, no "Dear Claude" preamble:\n\n${email}`,
  },
  "extract-action-items": {
    label: "Action items",
    system:
      "You are a productivity assistant. Extract actionable tasks precisely and concisely.",
    prompt: (email: string) =>
      `Extract all action items, tasks, or requests from this email. List each as a clear, specific task:\n\n${email}`,
  },
  "classify-urgency": {
    label: "Urgency classification",
    system:
      "You are an email triage assistant. Classify emails objectively based on their content.",
    prompt: (email: string) =>
      `Classify the urgency of this email (Urgent / High / Medium / Low) and explain why in 1–2 sentences:\n\n${email}`,
  },
} as const;

export type EmailAction = keyof typeof ACTIONS;

function buildEmailContext(email: {
  subject: string;
  from: string;
  date: string;
  body: string;
}): string {
  return [
    `Subject: ${email.subject}`,
    `From: ${email.from}`,
    `Date: ${email.date}`,
    "",
    email.body || "(No body content)",
  ].join("\n");
}

export async function generateEmailAction(
  _prevState: EmailActionState,
  formData: FormData
): Promise<EmailActionState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const messageId = (formData.get("message_id") as string | null)?.trim();
  const action = (formData.get("action") as EmailAction | null) ?? "summarize";

  if (!messageId) return { error: "No email selected." };
  if (!(action in ACTIONS)) return { error: "Unknown action." };

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (!membership) return { error: "No organization found." };
  const orgId = membership.organization_id;

  // Fetch email server-side — tokens never leave the server
  const email = await fetchEmailDetail(orgId, messageId);
  if (!email) {
    return {
      error:
        "Could not fetch the email. Ensure Gmail is still connected.",
    };
  }

  const { system, prompt, label } = ACTIONS[action];
  const emailContext = buildEmailContext(email);

  let output: string;
  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: prompt(emailContext) }],
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

  // Save to agent_runs — email-assistant slug already exists in AGENT_TYPES
  await supabase.from("agent_runs").insert({
    organization_id: orgId,
    user_id: user.id,
    agent_type: "email-assistant",
    input: `[${label}] Subject: ${email.subject}\nFrom: ${email.from}`,
    output,
  });

  revalidatePath("/outputs");

  return { output };
}
