"use client";

/**
 * Dashboard topbar.
 *
 * - Mobile: shows brand + hamburger to open the sidebar.
 * - Desktop: aligns with the sidebar's right edge, showing page title and
 *   right-aligned actions (User badge with email).
 */

import Image from "next/image";
import type { ReactNode } from "react";

type DashboardTopbarProps = {
  onMenuClick: () => void;
  userEmail?: string;
  rightSlot?: ReactNode;
};

export default function DashboardTopbar({
  onMenuClick,
  userEmail,
  rightSlot,
}: DashboardTopbarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-gray-200 bg-white/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/70 sm:px-6">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 md:hidden"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden
        >
          <path d="M3 6h18" />
          <path d="M3 12h18" />
          <path d="M3 18h18" />
        </svg>
      </button>

      {/* Mobile brand (sidebar logo is hidden behind drawer) */}
      <div className="flex items-center gap-2 md:hidden">
        <Image
          src="/logo.png"
          alt=""
          width={24}
          height={24}
          priority
          className="h-6 w-6 rounded-full"
        />
        <span className="text-sm font-semibold tracking-tight text-black">
          Form<span className="text-brand">Whats</span>
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right slot (search, etc.) */}
      {rightSlot}

      {/* User badge */}
      {userEmail && (
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-1 pr-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand-dark"
            aria-hidden
          >
            {userEmail.slice(0, 1).toUpperCase()}
          </span>
          <span className="hidden max-w-[140px] truncate text-sm text-gray-700 sm:inline">
            {userEmail}
          </span>
        </div>
      )}
    </header>
  );
}
