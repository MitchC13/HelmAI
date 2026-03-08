"use client";

import { useActionState } from "react";
import { runCopywriter } from "@/lib/actions/copywriter";

type ToneProfile = { id: string; name: string };

export function CopywriterForm({
  toneProfiles,
}: {
  toneProfiles: ToneProfile[];
}) {
  const [state, action, pending] = useActionState(runCopywriter, undefined);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        {toneProfiles.length > 0 && (
          <div>
            <label
              htmlFor="tone_profile_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tone Profile{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <select
              id="tone_profile_id"
              name="tone_profile_id"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">None — use default voice</option>
              {toneProfiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="input"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Prompt <span className="text-red-500">*</span>
          </label>
          <textarea
            id="input"
            name="input"
            rows={5}
            required
            placeholder="Describe what copy you need. E.g. 'A landing page headline for a B2B SaaS tool that saves teams 10 hours per week.'"
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
          {pending ? "Generating…" : "Generate"}
        </button>
      </form>

      {state?.output && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            Output
          </p>
          <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {state.output}
          </div>
        </div>
      )}
    </div>
  );
}
