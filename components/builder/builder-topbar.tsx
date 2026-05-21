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
};

/**
 * Sticky horizontal bar that crowns the form builder. Holds:
 *   - Back to dashboard
 *   - Form name (read-only display)
 *   - Preview button
 *   - Primary Save action
 *
 * Designed to sit just below the global SiteHeader; it stays glued to the
 * top of the builder shell so users can save without scrolling.
 */
export default function BuilderTopbar({
  title,
  subtitle = "Builder",
  isSaving = false,
  saveLabel = "Save",
  onSave,
  previewSlug,
}: BuilderTopbarProps) {
  function handlePreview() {
    if (previewSlug) {
      window.open(`/form/${previewSlug}`, "_blank", "noopener,noreferrer");
    } else {
      window.alert("Preview will be improved later.");
    }
  }

  return (
    <div className="sticky top-[57px] z-20 -mx-4 mb-4 border-b border-gray-200 bg-white/85 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: back + title */}
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-gray-300 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
            aria-label="Back to Dashboard"
          >
            <span aria-hidden>←</span> Back
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

        {/* Right: preview + save */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-black transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-brand-dark active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
