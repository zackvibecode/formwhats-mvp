"use client";

/**
 * Statistic cards for the dashboard overview.
 *
 * Pure presentational. Values are computed by the page (where the form
 * data lives) and passed in as a single object. The component renders a
 * 4-card grid: 1-col on mobile, 2-col on tablet, 4-col on desktop.
 */

import type { ReactNode } from "react";

export type DashboardStats = {
  totalForms: number;
  activeForms: number;
  totalResponses: number;
  responsesLast7Days: number;
};

type StatsCardsProps = {
  stats: DashboardStats;
  isLoading?: boolean;
};

type StatItem = {
  label: string;
  value: number;
  hint?: string;
  icon: ReactNode;
};

export default function StatsCards({
  stats,
  isLoading = false,
}: StatsCardsProps) {
  const items: StatItem[] = [
    {
      label: "Total Forms",
      value: stats.totalForms,
      icon: <FormsIcon />,
    },
    {
      label: "Active Forms",
      value: stats.activeForms,
      hint:
        stats.totalForms > 0
          ? `${Math.round((stats.activeForms / stats.totalForms) * 100)}% live`
          : undefined,
      icon: <PulseIcon />,
    },
    {
      label: "Total Responses",
      value: stats.totalResponses,
      icon: <InboxIcon />,
    },
    {
      label: "Last 7 Days",
      value: stats.responsesLast7Days,
      hint: "responses",
      icon: <ClockIcon />,
    },
  ];

  return (
    <section
      aria-label="Overview statistics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {items.map((item) => (
        <StatCard
          key={item.label}
          item={item}
          isLoading={isLoading}
        />
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------

function StatCard({ item, isLoading }: { item: StatItem; isLoading: boolean }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-gray-300">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {item.label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand-dark">
          {item.icon}
        </span>
      </div>
      <div className="mt-3">
        {isLoading ? (
          <div
            className="h-7 w-20 animate-pulse rounded bg-gray-100"
            aria-hidden
          />
        ) : (
          <p className="text-2xl font-bold tracking-tight text-black tabular-nums">
            {formatNumber(item.value)}
          </p>
        )}
        {item.hint && !isLoading && (
          <p className="mt-1 text-xs text-gray-500">{item.hint}</p>
        )}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

// ---------------------------------------------------------------------------
// Icons (inline, 16px)
// ---------------------------------------------------------------------------

const iconClass = "h-4 w-4";

function FormsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </svg>
  );
}

function PulseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <path d="M3 12h4l2-7 4 14 2-7h6" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <path d="M22 13H16l-2 3h-4l-2-3H2" />
      <path d="M5.45 5.11 2 13v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5l-3.45-7.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={iconClass}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
