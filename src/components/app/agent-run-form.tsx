"use client";

import { useActionState } from "react";
import { runAgent } from "@/lib/actions/agents";

export function AgentRunForm({ agentType }: { agentType: string }) {
  const [state, action, pending] = useActionState(runAgent, undefined);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <input type="hidden" name="agent_type" value={agentType} />

        <div>
          <label
            htmlFor="input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Prompt
          </label>
          <textarea
            id="input"
            name="input"
            rows={5}
            required
            placeholder="Describe what you need…"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-black text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {pending ? "Running…" : "Run agent"}
        </button>
      </form>

      {state?.output && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Output
          </p>
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
            {state.output}
          </pre>
        </div>
      )}
    </div>
  );
}
