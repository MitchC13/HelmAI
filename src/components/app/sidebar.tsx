"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tone Profiles", href: "/tone-profiles" },
  { label: "Agents", href: "/agents" },
  { label: "Inbox", href: "/inbox" },
  { label: "Calendar", href: "/calendar" },
  { label: "Outputs", href: "/outputs" },
  { label: "Integrations", href: "/integrations" },
  { label: "Billing", href: "/billing" },
  { label: "Settings", href: "/settings" },
];

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-52 shrink-0 bg-gray-900 text-white flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5">
        <span className="font-semibold text-base tracking-tight">HelmAI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ label, href }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-5 py-4 border-t border-gray-800">
        <p className="text-xs text-gray-500 truncate mb-2">{userEmail}</p>
        <form action={signOut}>
          <button
            type="submit"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
