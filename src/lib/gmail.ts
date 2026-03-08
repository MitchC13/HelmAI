import { getAccessToken } from "@/lib/oauth-tokens";

const PROVIDER = "gmail";
const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GmailMessage = {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
};

export type GmailMessageDetail = GmailMessage & {
  body: string; // plain-text body, best-effort
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function headerValue(
  headers: { name: string; value: string }[],
  name: string
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

/** Recursively finds the first text/plain (or text/html fallback) part. */
function extractBody(payload: {
  mimeType?: string;
  body?: { data?: string };
  parts?: unknown[];
}): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8");
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    // Prefer text/plain
    for (const part of payload.parts) {
      const p = part as typeof payload;
      if (p.mimeType === "text/plain") {
        const text = extractBody(p);
        if (text) return text;
      }
    }
    // Fall back to text/html
    for (const part of payload.parts) {
      const p = part as typeof payload;
      if (p.mimeType === "text/html" && p.body?.data) {
        // Strip tags minimally — just return plain text
        const html = Buffer.from(p.body.data, "base64").toString("utf-8");
        return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      }
      // Recurse into nested multipart
      const nested = extractBody(p);
      if (nested) return nested;
    }
  }

  return "";
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Fetches the 10 most recent messages (metadata only: subject, from, date). */
export async function fetchRecentEmails(
  orgId: string,
  limit = 10
): Promise<GmailMessage[] | null> {
  const accessToken = await getAccessToken(orgId, PROVIDER);
  if (!accessToken) return null;

  // 1. Get message IDs
  const listRes = await fetch(
    `${BASE}/messages?maxResults=${limit}&labelIds=INBOX`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!listRes.ok) return null;

  const listData = await listRes.json();
  const ids: string[] = (listData.messages ?? []).map(
    (m: { id: string }) => m.id
  );
  if (ids.length === 0) return [];

  // 2. Fetch metadata for each message in parallel
  const results = await Promise.all(
    ids.map(async (id): Promise<GmailMessage | null> => {
      const res = await fetch(
        `${BASE}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!res.ok) return null;

      const msg = await res.json();
      const headers: { name: string; value: string }[] =
        msg.payload?.headers ?? [];

      return {
        id: msg.id,
        threadId: msg.threadId,
        subject: headerValue(headers, "Subject") || "(No subject)",
        from: headerValue(headers, "From") || "(Unknown sender)",
        date: headerValue(headers, "Date") || "",
        snippet: msg.snippet ?? "",
      };
    })
  );

  return results.filter((m): m is GmailMessage => m !== null);
}

/** Fetches full detail for a single message, including body. */
export async function fetchEmailDetail(
  orgId: string,
  messageId: string
): Promise<GmailMessageDetail | null> {
  const accessToken = await getAccessToken(orgId, PROVIDER);
  if (!accessToken) return null;

  const res = await fetch(`${BASE}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;

  const msg = await res.json();
  const headers: { name: string; value: string }[] =
    msg.payload?.headers ?? [];

  const body = extractBody(msg.payload ?? {});

  return {
    id: msg.id,
    threadId: msg.threadId,
    subject: headerValue(headers, "Subject") || "(No subject)",
    from: headerValue(headers, "From") || "(Unknown sender)",
    date: headerValue(headers, "Date") || "",
    snippet: msg.snippet ?? "",
    body,
  };
}
