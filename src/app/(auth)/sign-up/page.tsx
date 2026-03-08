"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp } from "@/lib/actions/auth";

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, undefined);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
      <h1 className="text-2xl font-semibold mb-6">Create account</h1>

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            autoComplete="name"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
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
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-sm text-gray-500 text-center">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-black underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
