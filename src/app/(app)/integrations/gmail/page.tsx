import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { disconnectGmail } from "@/lib/actions/integrations";
import { fetchRecentEmails } from "@/lib/gmail";

function parseFrom(from: string): { name: string; email: string } {
  // "Display Name <email@example.com>" or just "email@example.com"
  const match = from.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim() || match[2], email: match[2] };
  }
  return { name: from, email: from };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export default async function GmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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

  const { data: record } = await supabase
    .from("org_integrations")
    .select("status")
    .eq("organization_id", membership.organization_id)
    .eq("provider", "gmail")
    .single();

  const isConnected = record?.status === "connected";

  const emails = isConnected
    ? await fetchRecentEmails(membership.organization_id)
    : null;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/integrations"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Integrations
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-3">Gmail</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Read inbox context for AI-assisted email writing.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Connection status card */}
      <div className="bg-white border border-gray-200 rounded-lg px-5 py-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Connection status
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {isConnected
                ? "Your Gmail account is connected."
                : "Connect your Gmail account to get started."}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {isConnected ? (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Connected
                </span>
                <form action={disconnectGmail}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 rounded-md px-4 py-1.5 hover:bg-red-50 transition-colors"
                  >
                    Disconnect
                  </button>
                </form>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  Not connected
                </span>
                <Link
                  href="/api/integrations/gmail/connect"
                  className="text-sm font-medium px-4 py-1.5 rounded-md border transition-colors border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Connect
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recent emails */}
      {isConnected && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Recent emails
          </h2>

          {emails === null ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
              Could not fetch emails. Try disconnecting and reconnecting.
            </div>
          ) : emails.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-sm text-gray-400">
              No emails found in inbox.
            </div>
          ) : (
            <div className="space-y-2">
              {emails.map((email) => {
                const { name } = parseFrom(email.from);
                return (
                  <Link
                    key={email.id}
                    href={`/integrations/gmail/${email.id}`}
                    className="block bg-white border border-gray-200 rounded-lg px-5 py-3.5 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {email.subject}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {name}
                        </p>
                        {email.snippet && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {email.snippet}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 pt-0.5">
                        {formatDate(email.date)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
