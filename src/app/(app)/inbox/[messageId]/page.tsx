import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchEmailDetail } from "@/lib/gmail";
import { EmailActionForm } from "@/components/app/email-action-form";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

export default async function InboxMessagePage({
  params,
}: {
  params: Promise<{ messageId: string }>;
}) {
  const { messageId } = await params;
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

  if (!membership) redirect("/inbox");

  // Guard: Gmail must be connected
  const { data: integration } = await supabase
    .from("org_integrations")
    .select("status")
    .eq("organization_id", membership.organization_id)
    .eq("provider", "gmail")
    .single();

  if (integration?.status !== "connected") redirect("/inbox");

  const email = await fetchEmailDetail(membership.organization_id, messageId);
  if (!email) notFound();

  return (
    <div className="max-w-2xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/inbox"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Inbox
        </Link>
      </div>

      {/* Email metadata */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
        <h1 className="text-base font-semibold text-gray-900 mb-3 leading-snug">
          {email.subject}
        </h1>
        <div className="space-y-1 text-sm">
          <div className="flex gap-3">
            <span className="text-gray-400 w-10 shrink-0">From</span>
            <span className="text-gray-700 truncate">{email.from}</span>
          </div>
          <div className="flex gap-3">
            <span className="text-gray-400 w-10 shrink-0">Date</span>
            <span className="text-gray-700">{formatDate(email.date)}</span>
          </div>
        </div>
      </div>

      {/* Email body */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Message
        </p>
        {email.body ? (
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
            {email.body}
          </p>
        ) : email.snippet ? (
          <p className="text-sm text-gray-600 italic">{email.snippet}</p>
        ) : (
          <p className="text-sm text-gray-400 italic">
            No body content available.
          </p>
        )}
      </div>

      {/* AI actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
          AI actions
        </p>
        <EmailActionForm messageId={messageId} />
      </div>
    </div>
  );
}
