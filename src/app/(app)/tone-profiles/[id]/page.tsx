import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ToneProfileDetailPage({
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

  // RLS ensures the user can only see profiles belonging to their org
  const { data: profile, error } = await supabase
    .from("tone_profiles")
    .select("id, name, description, config, created_at")
    .eq("id", id)
    .single();

  if (error || !profile) notFound();

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/tone-profiles"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Tone Profiles
        </Link>
        <h1 className="text-xl font-semibold text-gray-900 mt-2">
          {profile.name}
        </h1>
        {profile.description && (
          <p className="text-sm text-gray-500 mt-1">{profile.description}</p>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">
            Created
          </p>
          <p className="text-sm text-gray-700">
            {new Date(profile.created_at).toLocaleString()}
          </p>
        </div>

        <div className="px-5 py-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Config
          </p>
          <pre className="text-xs text-gray-700 bg-gray-50 rounded-md p-3 overflow-x-auto font-mono whitespace-pre-wrap break-words">
            {JSON.stringify(profile.config, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
