"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type OrgState = { error?: string } | undefined;

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createOrganization(
  _prevState: OrgState,
  formData: FormData
): Promise<OrgState> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    return { error: "Organization name is required." };
  }

  // Append a short timestamp suffix to avoid slug collisions
  const slug = `${slugify(name)}-${Date.now().toString(36)}`;

  const { data: org, error: orgError } = await admin
    .from("organizations")
    .insert({ name, slug })
    .select("id")
    .single();

  if (orgError) {
    return { error: orgError.message };
  }

  const { error: memberError } = await admin
    .from("organization_members")
    .insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
    });

  if (memberError) {
    return { error: memberError.message };
  }

  redirect("/dashboard");
}
