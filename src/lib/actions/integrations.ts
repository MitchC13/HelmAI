"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteTokens } from "@/lib/oauth-tokens";

async function resolveOrg() {
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

  return membership.organization_id as string;
}

async function disconnectProvider(provider: string, returnPath: string) {
  const orgId = await resolveOrg();
  const admin = createAdminClient();

  await deleteTokens(orgId, provider);

  await admin
    .from("org_integrations")
    .update({ status: "not_connected" })
    .eq("organization_id", orgId)
    .eq("provider", provider);

  redirect(returnPath);
}

export async function disconnectGoogleCalendar() {
  await disconnectProvider("google_calendar", "/integrations/google-calendar");
}

export async function disconnectGmail() {
  await disconnectProvider("gmail", "/integrations/gmail");
}
