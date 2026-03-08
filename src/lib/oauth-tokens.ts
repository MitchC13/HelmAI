/**
 * Shared OAuth token helper.
 * All token reads/writes go through the service role (admin) client —
 * the integration_tokens table has RLS enabled with zero policies, so
 * the authenticated role cannot access it at all.
 */
import { createAdminClient } from "@/lib/supabase/admin";

type TokenRow = {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
};

async function refreshAccessToken(
  orgId: string,
  provider: string,
  refreshToken: string
): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  const { access_token, expires_in } = data;
  if (!access_token) return null;

  const tokenExpiresAt = new Date(
    Date.now() + (expires_in ?? 3600) * 1000
  ).toISOString();

  const admin = createAdminClient();
  await admin
    .from("integration_tokens")
    .update({ access_token, token_expires_at: tokenExpiresAt })
    .eq("organization_id", orgId)
    .eq("provider", provider);

  return access_token;
}

/** Returns a valid access token for the org+provider, refreshing if needed. */
export async function getAccessToken(
  orgId: string,
  provider: string
): Promise<string | null> {
  const admin = createAdminClient();

  const { data: row } = await admin
    .from("integration_tokens")
    .select("access_token, refresh_token, token_expires_at")
    .eq("organization_id", orgId)
    .eq("provider", provider)
    .single<TokenRow>();

  if (!row) return null;

  // Refresh if within 60 seconds of expiry
  if (row.token_expires_at) {
    const expiresAt = new Date(row.token_expires_at).getTime();
    if (Date.now() >= expiresAt - 60_000 && row.refresh_token) {
      return refreshAccessToken(orgId, provider, row.refresh_token);
    }
  }

  return row.access_token;
}

/** Upserts tokens for an org+provider. Used in OAuth callbacks. */
export async function upsertTokens(
  orgId: string,
  provider: string,
  tokens: {
    access_token: string;
    refresh_token?: string | null;
    expires_in?: number | null;
  }
): Promise<void> {
  const admin = createAdminClient();

  await admin.from("integration_tokens").upsert(
    {
      organization_id: orgId,
      provider,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? null,
      token_expires_at: new Date(
        Date.now() + (tokens.expires_in ?? 3600) * 1000
      ).toISOString(),
    },
    { onConflict: "organization_id,provider" }
  );
}

/** Deletes tokens for an org+provider. Used on disconnect. */
export async function deleteTokens(
  orgId: string,
  provider: string
): Promise<void> {
  const admin = createAdminClient();

  await admin
    .from("integration_tokens")
    .delete()
    .eq("organization_id", orgId)
    .eq("provider", provider);
}
