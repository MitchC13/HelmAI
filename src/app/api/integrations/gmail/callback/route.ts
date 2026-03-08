import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { upsertTokens } from "@/lib/oauth-tokens";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

function redirectError(msg: string) {
  const url = new URL("/integrations/gmail", APP_URL);
  url.searchParams.set("error", msg);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) return redirectError("Google authorization was denied.");
  if (!code || !state) return redirectError("Invalid OAuth callback.");

  const storedState = request.cookies.get("gmail_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return redirectError("Invalid state. Please try connecting again.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in", APP_URL));

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (!membership) return redirectError("No organization found.");

  const orgId = membership.organization_id;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/integrations/gmail/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return redirectError("Failed to exchange authorization code.");

  const { access_token, refresh_token, expires_in } = await tokenRes.json();
  if (!access_token) return redirectError("No access token returned from Google.");

  await upsertTokens(orgId, "gmail", { access_token, refresh_token, expires_in });

  const admin = createAdminClient();
  await admin.from("org_integrations").upsert(
    { organization_id: orgId, provider: "gmail", status: "connected", metadata: {} },
    { onConflict: "organization_id,provider" }
  );

  const response = NextResponse.redirect(new URL("/integrations/gmail", APP_URL));
  response.cookies.delete("gmail_oauth_state");
  return response;
}
