"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function disconnectGoogleCalendar() {
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

  const orgId = membership.organization_id;
  const admin = createAdminClient();

  // Delete tokens — service role required (RLS blocks authenticated role)
  await admin
    .from("integration_tokens")
    .delete()
    .eq("organization_id", orgId)
    .eq("provider", "google_calendar");

  // Update status back to not_connected
  await admin
    .from("org_integrations")
    .update({ status: "not_connected" })
    .eq("organization_id", orgId)
    .eq("provider", "google_calendar");

  redirect("/integrations/google-calendar");
}
