import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agents";
import { AgentRunForm } from "@/components/app/agent-run-form";

export default async function AgentRunPage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;

  const agent = getAgent(type);
  if (!agent) notFound();

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

  // Recent runs for this agent type in this org — RLS enforces org scope
  const { data: recentRuns } = await supabase
    .from("agent_runs")
    .select("id, input, created_at")
    .eq("organization_id", membership?.organization_id ?? "")
    .eq("agent_type", type)
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
          {agent.name}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{agent.description}</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <AgentRunForm agentType={type} />
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
