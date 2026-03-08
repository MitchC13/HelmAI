"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createToneProfile } from "@/lib/actions/tone-profiles";

export default function NewToneProfilePage() {
  const [state, action, pending] = useActionState(createToneProfile, undefined);

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
          New Tone Profile
        </h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <form action={action} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Formal Corporate"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Describe when and how this tone profile should be used."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
          </div>

          <div>
            <label
              htmlFor="config_json"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Config{" "}
              <span className="text-gray-400 font-normal">(JSON)</span>
            </label>
            <textarea
              id="config_json"
              name="config_json"
              rows={6}
              defaultValue="{}"
              spellCheck={false}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black resize-y"
            />
            <p className="text-xs text-gray-400 mt-1">
              Flexible JSON configuration for this profile. Must be a valid
              JSON object.
            </p>
          </div>

          {state?.error && (
            <p className="text-sm text-red-600">{state.error}</p>
          )}

          <div className="flex items-center gap-4 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="bg-black text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {pending ? "Creating…" : "Create profile"}
            </button>
            <Link
              href="/tone-profiles"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
