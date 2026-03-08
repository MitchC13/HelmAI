import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!;

function redirectError(msg: string) {
  const url = new URL("/integrations/google-calendar", APP_URL);
  url.searchParams.set("error", msg);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  if (errorParam) {
    return redirectError("Google authorization was denied.");
  }

  if (!code || !state) {
    return redirectError("Invalid OAuth callback.");
  }

  // Validate state to prevent CSRF
  const storedState = request.cookies.get("gc_oauth_state")?.value;
  if (!storedState || storedState !== state) {
    return redirectError("Invalid state. Please try connecting again.");
  }

  // Verify user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", APP_URL));
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .limit(1)
    .single();

  if (!membership) {
    return redirectError("No organization found.");
  }

  const orgId = membership.organization_id;

  // Exchange authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/integrations/google-calendar/callback`,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return redirectError("Failed to exchange authorization code.");
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokens;

  if (!access_token) {
    return redirectError("No access token returned from Google.");
  }

  const tokenExpiresAt = new Date(
    Date.now() + (expires_in ?? 3600) * 1000
  ).toISOString();

  // Store tokens via service role (bypasses RLS — tokens are never exposed to client)
  const admin = createAdminClient();

  await admin.from("integration_tokens").upsert(
    {
      organization_id: orgId,
      provider: "google_calendar",
      access_token,
      refresh_token: refresh_token ?? null,
      token_expires_at: tokenExpiresAt,
    },
    { onConflict: "organization_id,provider" }
  );

  // Update org_integrations status to connected
  await admin.from("org_integrations").upsert(
    {
      organization_id: orgId,
      provider: "google_calendar",
      status: "connected",
      metadata: {},
    },
    { onConflict: "organization_id,provider" }
  );

  // Clear state cookie and redirect to detail page
  const response = NextResponse.redirect(
    new URL("/integrations/google-calendar", APP_URL)
  );
  response.cookies.delete("gc_oauth_state");
  return response;
}
