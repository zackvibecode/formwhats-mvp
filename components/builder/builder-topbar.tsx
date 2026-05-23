"use client";

import Link from "next/link";

type BuilderTopbarProps = {
  /** Title shown in the centre. Empty string falls back to a placeholder. */
  title: string;
  /** Subtitle / breadcrumb-style text rendered above the title. */
  subtitle?: string;
  /** Disable the save button (e.g. while saving or when nothing changed). */
  isSaving?: boolean;
  /** Custom save button label, e.g. "Save Form" or "Save Changes". */
  saveLabel?: string;
  /** Save handler. */
  onSave: () => void;
  /** Optional public form slug for a Preview / View link. */
  previewSlug?: string;
  /** Optional form id, used to link the Responses tab to the right form. */
  formId?: string;
};

/**
 * Sticky horizontal bar that crowns the form builder.
 *
 * Layout (Tally-style):
 *   [back] [title]     [Build | Share | Responses]     [Save] [Preview] [Open]
 *
 * Build is the active tab here (we're in the builder); Share scrolls to a
 * future share section, Responses jumps to the responses dashboard.
 */
export default function BuilderTopbar({
  title,
  subtitle = "Builder",
  isSaving = false,
  saveLabel = "Save",
  onSave,
  previewSlug,
  formId,
}: BuilderTopbarProps) {
  function handlePreview() {
    if (previewSlug) {
      window.open(`/form/${previewSlug}`, "_blank", "noopener,noreferrer");
    } else {
      window.alert("Save the form first to preview it.");
    }
  }

  function handleOpen() {
    if (previewSlug) {
      window.open(`/form/${previewSlug}`, "_blank", "noopener,noreferrer");
    } else {
      window.alert("Save the form first to open the public link.");
    }
  }

  // Tab is "Responses" only navigable when the form already exists.
  const responsesHref = formId ? `/dashboard/forms/${formId}/responses` : null;

  return (
    <div className="sticky top-16 z-10 mb-4 border-b border-gray-200 bg-white/85 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: back + title */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            aria-label="Back to Dashboard"
          >
            <ChevronLeftIcon />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              {subtitle}
            </p>
            <p className="truncate text-sm font-semibold text-black">
              {title.trim() === "" ? "Untitled Form" : title}
            </p>
          </div>
        </div>

        {/* Centre: Build / Share / Responses tabs */}
        <nav
          aria-label="Builder tabs"
          className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 text-xs"
        >
          <span
            aria-current="page"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-semibold text-brand-dark shadow-sm"
          >
            <PencilIcon />
            Build
          </span>
          {previewSlug ? (
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-gray-500 transition-colors hover:text-black"
            >
              <ShareIcon />
              Share
            </button>
          ) : (
            <span
              title="Save the form first to share it"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-gray-300"
            >
              <ShareIcon />
              Share
            </span>
          )}
          {responsesHref ? (
            <Link
              href={responsesHref}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-gray-500 transition-colors hover:text-black"
            >
              <InboxIcon />
              Responses
            </Link>
          ) : (
            <span
              title="Save the form first to view responses"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-gray-300"
            >
              <InboxIcon />
              Responses
            </span>
          )}
        </nav>

        {/* Right: Save / Preview / Open */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : saveLabel}
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-black transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <EyeIcon /> Preview
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-black transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <ExternalLinkIcon /> Open
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline icons (no emoji per UI/UX skill rules)
// ---------------------------------------------------------------------------

const iconClass = "h-3.5 w-3.5";
const arrowClass = "h-4 w-4";

function ChevronLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={arrowClass}
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function PencilIcon() {
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

function ShareIcon() {
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
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.59 13.51l6.83 3.98" />
      <path d="M15.41 6.51l-6.82 3.98" />
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function EyeIcon() {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ExternalLinkIcon() {
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
      <path d="M10 14L21 3" />
      <path d="M21 9V3h-6" />
      <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </svg>
  );
}
