import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchRecentEmails } from "@/lib/gmail";

function parseFromName(from: string): string {
  const match = from.match(/^(.*?)\s*<[^>]+>$/);
  return match ? match[1].trim() || from : from;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export default async function InboxPage() {
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

  if (!membership) redirect("/dashboard");

  const { data: integration } = await supabase
    .from("org_integrations")
    .select("status")
    .eq("organization_id", membership.organization_id)
    .eq("provider", "gmail")
    .single();

  const isConnected = integration?.status === "connected";

  if (!isConnected) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-assisted actions on your recent emails.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Connect your Gmail account to use this feature.
          </p>
          <Link
            href="/integrations/gmail"
            className="text-sm font-medium text-gray-900 underline"
          >
            Go to Integrations →
          </Link>
        </div>
      </div>
    );
  }

  const emails = await fetchRecentEmails(membership.organization_id, 20);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Inbox</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select an email to view details and run AI actions.
        </p>
      </div>

      {emails === null ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-sm text-gray-400">
          Could not load emails.{" "}
          <Link
            href="/integrations/gmail"
            className="underline hover:text-gray-700"
          >
            Check your connection.
          </Link>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-sm text-gray-400">
          No emails found in inbox.
        </div>
      ) : (
        <div className="divide-y divide-gray-100 bg-white border border-gray-200 rounded-lg overflow-hidden">
          {emails.map((email) => (
            <Link
              key={email.id}
              href={`/inbox/${email.id}`}
              className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              {/* Sender + subject + snippet */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3 mb-0.5">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {parseFromName(email.from)}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0">
                    {formatDate(email.date)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate">{email.subject}</p>
                {email.snippet && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {email.snippet}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
