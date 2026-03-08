"use server";

import Anthropic from "@anthropic-ai/sdk";
import { redirect } from "next/navigation";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

export type CopywriterState = { output?: string; error?: string } | undefined;

export async function runCopywriter(
  _prevState: CopywriterState,
  formData: FormData
): Promise<CopywriterState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const input = (formData.get("input") as string | null)?.trim();
  if (!input) return { error: "Please enter a prompt." };

  const toneProfileId =
    (formData.get("tone_profile_id") as string | null) || null;

  // Resolve org via RLS-scoped query
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (memberError || !membership) {
    return { error: "No organization found." };
  }

  // Optionally enrich the system prompt with the selected tone profile.
  // RLS on tone_profiles ensures the profile belongs to the user's org.
  let toneSection = "";
  if (toneProfileId) {
    const { data: tp } = await supabase
      .from("tone_profiles")
      .select("name, description, config")
      .eq("id", toneProfileId)
      .single();

    if (tp) {
      toneSection = `\n\nApply this tone profile:\nName: ${tp.name}`;
      if (tp.description) toneSection += `\nDescription: ${tp.description}`;
      const cfg = tp.config as Record<string, unknown>;
      if (Object.keys(cfg).length > 0) {
        toneSection += `\nConfig: ${JSON.stringify(cfg, null, 2)}`;
      }
    }
  }

  const systemPrompt =
    "You are an expert copywriter. Write compelling, conversion-focused copy based on the user's brief. " +
    "Write only the copy itself — no preamble, labels, or meta-commentary." +
    toneSection;

  let output: string;

  try {
    const message = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: input }],
    });

    const block = message.content[0];
    if (block.type !== "text") {
      return { error: "Unexpected response type from AI." };
    }
    output = block.text;
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return { error: "API key is invalid or missing. Check ANTHROPIC_API_KEY." };
    }
    if (err instanceof Anthropic.RateLimitError) {
      return { error: "Rate limit reached. Please try again in a moment." };
    }
    if (err instanceof Anthropic.APIError) {
      return { error: `Generation failed (${err.status}): ${err.message}` };
    }
    return { error: "An unexpected error occurred." };
  }

  // Persist the run — RLS enforces is_org_member + user_id = auth.uid()
  const { error: insertError } = await supabase.from("agent_runs").insert({
    organization_id: membership.organization_id,
    user_id: user.id,
    agent_type: "copywriter",
    input,
    output,
  });

  if (insertError) return { error: insertError.message };

  return { output };
}
