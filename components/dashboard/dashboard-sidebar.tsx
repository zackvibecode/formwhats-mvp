"use client";

/**
 * Dashboard sidebar.
 *
 * - Desktop (md+): fixed 240px left rail.
 * - Mobile: hidden by default, slides in as a drawer when `isOpen` is true.
 *   The page header owns the toggle button + state (lifted up so the
 *   hamburger and the drawer share one source of truth).
 *
 * Pure UI — does not own any data or auth state. Logout is a callback so
 * the topbar / page can wire it into Supabase without coupling here.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type DashboardSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void | Promise<void>;
  userEmail?: string;
};

type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  matchPrefix?: string;
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Forms",
    matchPrefix: "/dashboard",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[18px] w-[18px]"
        aria-hidden
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8" />
        <path d="M8 12h8" />
        <path d="M8 16h5" />
      </svg>
    ),
  },
];

export default function DashboardSidebar({
  isOpen,
  onClose,
  onLogout,
  userEmail,
}: DashboardSidebarProps) {
  const pathname = usePathname() ?? "";

  return (
    <>
      {/* Mobile overlay */}
      <button
        type="button"
        aria-label="Close sidebar"
        onClick={onClose}
        className={[
          "fixed inset-0 z-30 bg-black/30 backdrop-blur-sm transition-opacity duration-200 md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
      />

      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ease-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        aria-label="Dashboard navigation"
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-2 border-b border-gray-100 px-5">
          <Image
            src="/logo.png"
            alt=""
            width={28}
            height={28}
            priority
            className="h-7 w-7 rounded-full"
          />
          <span className="text-base font-semibold tracking-tight text-black">
            Form<span className="text-brand">Whats</span>
          </span>
        </div>

        {/* Primary CTA */}
        <div className="px-3 pt-4">
          <Link
            href="/dashboard/forms/new"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
            New Form
          </Link>
        </div>

        {/* Nav */}
        <nav className="mt-5 flex-1 px-3" aria-label="Sections">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = item.matchPrefix
                ? pathname === item.matchPrefix ||
                  pathname.startsWith(`${item.matchPrefix}/`)
                : pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                    className={[
                      "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-brand/10 text-brand-dark"
                        : "text-gray-700 hover:bg-gray-100 hover:text-black",
                    ].join(" ")}
                  >
                    <span
                      className={
                        isActive ? "text-brand-dark" : "text-gray-500"
                      }
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3">
          {userEmail && (
            <p
              className="mb-2 truncate px-2 text-xs text-gray-500"
              title={userEmail}
            >
              {userEmail}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              onClose();
              void onLogout();
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 hover:text-black"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[18px] w-[18px] text-gray-500"
              aria-hidden
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="M16 17l5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
