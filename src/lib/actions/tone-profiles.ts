"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ToneProfileState = { error?: string } | undefined;

export async function createToneProfile(
  _prevState: ToneProfileState,
  formData: FormData
): Promise<ToneProfileState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  // Resolve user's org via RLS-scoped query — returns only rows the user is a member of
  const { data: membership, error: memberError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (memberError || !membership) {
    return { error: "No organization found. Please create one first." };
  }

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) return { error: "Name is required." };

  const description =
    (formData.get("description") as string | null)?.trim() || null;

  const configRaw =
    (formData.get("config_json") as string | null)?.trim() || "{}";

  let config: unknown;
  try {
    config = JSON.parse(configRaw);
    if (typeof config !== "object" || config === null || Array.isArray(config)) {
      return { error: "Config must be a JSON object (e.g. {})." };
    }
  } catch {
    return { error: "Config must be valid JSON." };
  }

  // RLS enforces that the user must be an org admin/owner to insert
  const { error } = await supabase.from("tone_profiles").insert({
    organization_id: membership.organization_id,
    created_by: user.id,
    name,
    description,
    config,
  });

  if (error) return { error: error.message };

  redirect("/tone-profiles");
}
