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
    <div className="sticky top-[57px] z-20 -mx-4 mb-4 border-b border-gray-200 bg-white/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: back + title */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            aria-label="Back to Dashboard"
          >
            <span aria-hidden>←</span>
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
            <span aria-hidden>✏️</span>
            Build
          </span>
          {previewSlug ? (
            <button
              type="button"
              onClick={handlePreview}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-gray-500 transition-colors hover:text-black"
            >
              <span aria-hidden>🔗</span>
              Share
            </button>
          ) : (
            <span
              title="Save the form first to share it"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-gray-300"
            >
              <span aria-hidden>🔗</span>
              Share
            </span>
          )}
          {responsesHref ? (
            <Link
              href={responsesHref}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-gray-500 transition-colors hover:text-black"
            >
              <span aria-hidden>📥</span>
              Responses
            </Link>
          ) : (
            <span
              title="Save the form first to view responses"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-gray-300"
            >
              <span aria-hidden>📥</span>
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
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-black transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <span aria-hidden>👁</span> Preview
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="inline-flex items-center justify-center gap-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-black transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <span aria-hidden>↗</span> Open
          </button>
        </div>
      </div>
    </div>
  );
}
