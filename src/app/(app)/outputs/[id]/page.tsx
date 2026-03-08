import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAgent } from "@/lib/agents";
import { CopyButton } from "@/components/app/copy-button";
import { toggleFavorite, deleteOutput } from "@/lib/actions/outputs";

export default async function OutputDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  type Run = {
    id: string;
    agent_type: string;
    input: string;
    output: string | null;
    is_favorite: boolean;
    created_at: string;
    user_id: string;
    // Supabase returns FK joins as an array even for many-to-one relations
    tone_profiles: { name: string }[] | null;
  };

  // RLS scopes this to the user's org automatically
  const { data, error } = await supabase
    .from("agent_runs")
    .select(
      "id, agent_type, input, output, is_favorite, created_at, user_id, tone_profiles(name)"
    )
    .eq("id", id)
    .single();

  if (error || !data) notFound();

  const run = data as unknown as Run;
  const toneProfileName = run.tone_profiles?.[0]?.name ?? null;
  const agentName = getAgent(run.agent_type)?.name ?? run.agent_type;
  const isOwner = run.user_id === user.id;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/outputs"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Outputs
        </Link>
        <div className="flex items-center gap-2 mt-2 mb-1">
          <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded px-2 py-0.5">
            {agentName}
          </span>
          {toneProfileName && (
            <span className="text-xs text-gray-400">{toneProfileName}</span>
          )}
          {run.is_favorite && (
            <span className="text-xs text-amber-500">★ Favorited</span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {new Date(run.created_at).toLocaleString()}
        </p>
      </div>

      {/* Input */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-4">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Prompt
        </p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{run.input}</p>
      </div>

      {/* Output */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Output
        </p>
        {run.output ? (
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {run.output}
          </p>
        ) : (
          <p className="text-sm text-gray-400 italic">No output recorded.</p>
        )}
      </div>

      {/* Actions */}
      {isOwner && (
        <div className="flex items-center gap-3 flex-wrap">
          {/* Copy output to clipboard */}
          {run.output && <CopyButton text={run.output} />}

          {/* Toggle favorite */}
          <form action={toggleFavorite}>
            <input type="hidden" name="id" value={run.id} />
            <input
              type="hidden"
              name="is_favorite"
              value={(!run.is_favorite).toString()}
            />
            <button
              type="submit"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              {run.is_favorite ? "★ Unfavorite" : "☆ Favorite"}
            </button>
          </form>

          {/* Delete */}
          <form action={deleteOutput}>
            <input type="hidden" name="id" value={run.id} />
            <button
              type="submit"
              className="text-sm font-medium text-red-500 hover:text-red-700 border border-red-200 rounded-md px-4 py-2 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
