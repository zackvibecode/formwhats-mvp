"use client";

/**
 * Share modal for the form builder.
 *
 * Triggered from the topbar "Share" tab. Displays:
 *   - Status pill (Active / Inactive)
 *   - Public URL with one-click copy
 *   - QR code (rendered with qrcode.react — already a dep)
 *   - Short instructions for the form owner
 *
 * Intentionally a thin presentational component. The parent page owns
 * the open/close state, the slug, and the active flag — share-panel
 * just renders. No Supabase calls, no business logic.
 */

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

type SharePanelProps = {
  /** Whether the modal is open. Parent controls visibility. */
  isOpen: boolean;
  /** Close handler. */
  onClose: () => void;
  /** Public form slug. */
  slug: string;
  /** Whether the form is currently active (accepts submissions). */
  isActive: boolean;
  /** Optional form title for the header. */
  formTitle?: string;
};

export default function SharePanel({
  isOpen,
  onClose,
  slug,
  isActive,
  formTitle,
}: SharePanelProps) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  // Resolve origin client-side so the modal works on any deployment.
  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  // Close on ESC for keyboard users.
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const publicUrl = origin ? `${origin}/form/${slug}` : `/form/${slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy share link", err);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share form"
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close share dialog"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              Share
            </p>
            <h2 className="mt-0.5 truncate text-lg font-semibold tracking-tight text-black">
              {formTitle?.trim() || "Untitled Form"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-gray-300 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5"
              aria-hidden
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Status pill */}
        <div className="mt-3">
          <span
            className={[
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              isActive
                ? "bg-brand/10 text-brand-dark"
                : "bg-gray-100 text-gray-600",
            ].join(" ")}
          >
            <span
              aria-hidden
              className={[
                "h-1.5 w-1.5 rounded-full",
                isActive ? "bg-brand" : "bg-gray-400",
              ].join(" ")}
            />
            {isActive ? "Active — accepting responses" : "Inactive — paused"}
          </span>
        </div>

        {/* Public URL */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-black">Public form link</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-1.5">
            <code className="flex-1 truncate px-2 font-mono text-xs text-black">
              {publicUrl}
            </code>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!origin}
              className="shrink-0 rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* QR */}
        <div className="mt-5">
          <p className="text-xs font-semibold text-black">QR code</p>
          <div className="mt-2 flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg bg-white">
              {origin ? (
                <QRCodeSVG
                  value={publicUrl}
                  size={120}
                  level="M"
                  className="h-full w-full"
                />
              ) : (
                <div
                  className="h-full w-full animate-pulse rounded bg-gray-100"
                  aria-hidden
                />
              )}
            </div>
            <div className="min-w-0 text-[11px] leading-relaxed text-gray-500">
              Customers can scan this from their phone camera. Print it on
              flyers, posters, or in-store displays.
            </div>
          </div>
        </div>

        {/* Instructions */}
        <ul className="mt-5 flex flex-col gap-1.5 text-[11px] leading-relaxed text-gray-500">
          <li className="flex gap-2">
            <span aria-hidden className="text-brand-dark">•</span>
            Send the link via WhatsApp, SMS, or email.
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-brand-dark">•</span>
            Each submission sends the customer to your WhatsApp.
          </li>
          <li className="flex gap-2">
            <span aria-hidden className="text-brand-dark">•</span>
            Pause the form anytime by toggling Active off in Form Details.
          </li>
        </ul>

        {/* Footer actions */}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-gray-50"
          >
            Close
          </button>
          <a
            href={origin ? publicUrl : "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
          >
            Open form
          </a>
        </div>
      </div>
    </div>
  );
}
