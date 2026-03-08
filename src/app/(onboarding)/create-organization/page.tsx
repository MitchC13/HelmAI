"use client";

import { useActionState } from "react";
import { createOrganization } from "@/lib/actions/organizations";

export default function CreateOrganizationPage() {
  const [state, action, pending] = useActionState(createOrganization, undefined);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
      <h1 className="text-2xl font-semibold mb-2">Create your organization</h1>
      <p className="text-sm text-gray-500 mb-6">
        This is the workspace for your team. You can rename it later.
      </p>

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Organization name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Acme Inc."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full bg-black text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {pending ? "Creating…" : "Create organization"}
        </button>
      </form>
    </div>
  );
}
