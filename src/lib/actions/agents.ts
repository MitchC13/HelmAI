"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agents";

export type AgentRunState = { output?: string; error?: string } | undefined;

// Placeholder output until Anthropic is wired up in a later phase.
function placeholderOutput(agentType: string, input: string): string {
  const prefixes: Record<string, string> = {
    copywriter: "Here's your copy draft:\n\n",
    "content-strategist": "Here's your content strategy outline:\n\n",
    "ad-creative": "Here are your ad creative concepts:\n\n",
    "email-assistant": "Here's your email draft:\n\n",
    "automation-builder": "Here's your automation workflow:\n\n",
  };

  const prefix = prefixes[agentType] ?? "Here's your output:\n\n";
  const preview =
    input.length > 80 ? input.slice(0, 80) + "…" : input;

  return (
    `${prefix}` +
    `[Placeholder — prompt received: "${preview}"]\n\n` +
    `Claude AI generation will be connected in the next phase.`
  );
}

export async function runAgent(
  _prevState: AgentRunState,
  formData: FormData
): Promise<AgentRunState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const agentType = formData.get("agent_type") as string | null;
  const input = (formData.get("input") as string | null)?.trim();

  if (!agentType || !getAgent(agentType)) {
    return { error: "Invalid agent type." };
  }
  if (!input) {
    return { error: "Please enter a prompt." };
  }

  // Resolve org via RLS-scoped query — returns only the user's membership rows
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (memberError || !membership) {
    return { error: "No organization found." };
  }

  const output = placeholderOutput(agentType, input);

  // RLS enforces org membership + user_id = auth.uid() on insert
  const { error: insertError } = await supabase.from("agent_runs").insert({
    organization_id: membership.organization_id,
    user_id: user.id,
    agent_type: agentType,
    input,
    output,
  });

  if (insertError) return { error: insertError.message };

  return { output };
}
