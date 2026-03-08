import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agents";

export default async function OutputsPage() {
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

  const { data: runs } = await supabase
    .from("agent_runs")
    .select("id, agent_type, input, is_favorite, created_at, tone_profiles(name)")
    .eq("organization_id", membership?.organization_id ?? "")
    .order("created_at", { ascending: false });

  type Run = {
    id: string;
    agent_type: string;
    input: string;
    is_favorite: boolean;
    created_at: string;
    // Supabase returns FK joins as an array even for many-to-one relations
    tone_profiles: { name: string }[] | null;
  };

  const typedRuns = (runs ?? []) as unknown as Run[];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Outputs</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Generated content from all agent runs in your organization.
        </p>
      </div>

      {typedRuns.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-sm text-gray-400">
          No outputs yet.{" "}
          <Link href="/agents" className="text-black underline">
            Run an agent to get started.
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {typedRuns.map((run) => {
            const agentName = getAgent(run.agent_type)?.name ?? run.agent_type;
            const preview =
              run.input.length > 120
                ? run.input.slice(0, 120) + "…"
                : run.input;
            const toneProfileName = run.tone_profiles?.[0]?.name ?? null;

            return (
              <Link
                key={run.id}
                href={`/outputs/${run.id}`}
                className="block bg-white border border-gray-200 rounded-lg px-5 py-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded px-2 py-0.5">
                        {agentName}
                      </span>
                      {toneProfileName && (
                        <span className="text-xs text-gray-400">
                          {toneProfileName}
                        </span>
                      )}
                      {run.is_favorite && (
                        <span className="text-xs text-amber-500">★</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 truncate">{preview}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                    {new Date(run.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
