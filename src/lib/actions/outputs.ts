"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Toggle is_favorite on a run the current user owns.
// RLS update policy enforces user_id = auth.uid().
export async function toggleFavorite(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const id = formData.get("id") as string;
  const newValue = formData.get("is_favorite") === "true";

  await supabase
    .from("agent_runs")
    .update({ is_favorite: newValue })
    .eq("id", id);

  revalidatePath(`/outputs/${id}`);
  revalidatePath("/outputs");
}

// Permanently delete a run the current user owns.
// RLS delete policy enforces user_id = auth.uid().
export async function deleteOutput(formData: FormData): Promise<void> {
  const supabase = await createClient();

  const id = formData.get("id") as string;

  await supabase.from("agent_runs").delete().eq("id", id);

  redirect("/outputs");
}
