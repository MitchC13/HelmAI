import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CopywriterForm } from "@/components/app/copywriter-form";

export default async function CopywriterPage() {
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

  const orgId = membership?.organization_id ?? "";

  // Tone profiles for the selector — RLS scopes to user's org
  const { data: toneProfiles } = await supabase
    .from("tone_profiles")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("name", { ascending: true });

  // Recent copywriter runs for this org
  const { data: recentRuns } = await supabase
    .from("agent_runs")
    .select("id, input, created_at")
    .eq("organization_id", orgId)
    .eq("agent_type", "copywriter")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/agents"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Agents
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">
          Copywriter
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Generate compelling copy for websites, landing pages, and campaigns.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <CopywriterForm toneProfiles={toneProfiles ?? []} />
      </div>

      {recentRuns && recentRuns.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-700 mb-3">
            Recent Runs
          </h2>
          <div className="space-y-2">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="bg-white border border-gray-200 rounded-lg px-4 py-3"
              >
                <p className="text-xs text-gray-400 mb-1">
                  {new Date(run.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 truncate">{run.input}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
