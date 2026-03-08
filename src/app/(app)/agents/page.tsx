import Link from "next/link";
import { AGENT_TYPES } from "@/lib/agents";

export default function AgentsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Agents</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Select an agent type to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {AGENT_TYPES.map((agent) => (
          <Link
            key={agent.slug}
            href={`/agents/${agent.slug}`}
            className="block bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors"
          >
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {agent.name}
            </p>
            <p className="text-sm text-gray-500">{agent.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
