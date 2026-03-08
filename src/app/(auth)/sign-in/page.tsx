"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn } from "@/lib/actions/auth";

export default function SignInPage() {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>

      <form action={action} className="space-y-4">
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
            autoComplete="current-password"
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
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-sm text-gray-500 text-center">
        No account?{" "}
        <Link href="/sign-up" className="text-black underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
