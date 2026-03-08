import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INTEGRATIONS } from "@/lib/integrations";

// Integrations that have a live connection flow
const LIVE_INTEGRATIONS = new Set(["google_calendar", "gmail"]);

type OrgIntegration = {
  provider: string;
  status: string;
};

export default async function IntegrationsPage() {
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

  // Fetch any integration records already stored for this org
  const { data: records } = await supabase
    .from("org_integrations")
    .select("provider, status")
    .eq("organization_id", membership?.organization_id ?? "");

  const connected = new Map<string, string>(
    (records ?? []).map((r: OrgIntegration) => [r.provider, r.status])
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Connect HelmAI to your existing tools and workflows.
        </p>
      </div>

      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => {
          const status = connected.get(integration.id) ?? "not_connected";
          const isConnected = status === "connected";

          return (
            <div
              key={integration.id}
              className="bg-white border border-gray-200 rounded-lg px-5 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {integration.name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {integration.description}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={status} />
                {LIVE_INTEGRATIONS.has(integration.id) ? (
                  <Link
                    href={`/integrations/${integration.id.replace("_", "-")}`}
                    className="text-sm font-medium px-4 py-1.5 rounded-md border transition-colors border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {isConnected ? "Manage" : "Connect"}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="text-sm font-medium px-4 py-1.5 rounded-md border transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-gray-300 text-gray-600"
                  >
                    {isConnected ? "Manage" : "Connect"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-gray-400">
        Google Drive, Notion, and Slack connection flows will be available in an
        upcoming release.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        Connected
      </span>
    );
  }

  if (status === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Error
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2.5 py-0.5">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
      Not connected
    </span>
  );
}
