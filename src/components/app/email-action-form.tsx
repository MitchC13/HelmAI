"use client";

import { useActionState, useState } from "react";
import { generateEmailAction } from "@/lib/actions/email";
import type { EmailAction } from "@/lib/actions/email";

const ACTIONS: { value: EmailAction; label: string }[] = [
  { value: "summarize", label: "Summarize this email" },
  { value: "draft-reply", label: "Draft a reply" },
  { value: "extract-action-items", label: "Extract action items" },
  { value: "classify-urgency", label: "Classify urgency" },
];

export function EmailActionForm({ messageId }: { messageId: string }) {
  const [state, formAction, isPending] = useActionState(
    generateEmailAction,
    undefined
  );
  const [action, setAction] = useState<EmailAction>("summarize");

  return (
    <div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="message_id" value={messageId} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            AI action
          </label>
          <select
            name="action"
            value={action}
            onChange={(e) => setAction(e.target.value as EmailAction)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            {ACTIONS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="text-sm font-medium bg-gray-900 text-white px-5 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? "Generating…" : "Generate"}
        </button>
      </form>

      {state?.output && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
            Result
          </p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
            {state.output}
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Saved to{" "}
            <a href="/outputs" className="underline hover:text-gray-700">
              Outputs
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
