import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ToneProfilesPage() {
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

  const { data: profiles } = await supabase
    .from("tone_profiles")
    .select("id, name, description, created_at")
    .eq("organization_id", membership?.organization_id ?? "")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Tone Profiles
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Saved tone configurations for your organization.
          </p>
        </div>
        <Link
          href="/tone-profiles/new"
          className="bg-black text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
        >
          New Profile
        </Link>
      </div>

      {!profiles || profiles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-sm text-gray-400">
          No tone profiles yet.{" "}
          <Link href="/tone-profiles/new" className="text-black underline">
            Create one.
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((profile) => (
            <Link
              key={profile.id}
              href={`/tone-profiles/${profile.id}`}
              className="block bg-white border border-gray-200 rounded-lg px-5 py-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {profile.name}
                  </p>
                  {profile.description && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                      {profile.description}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap shrink-0">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
