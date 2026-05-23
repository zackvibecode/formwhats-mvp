"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import ButtonLink from "@/components/button-link";
import StatsCards, {
  type DashboardStats,
} from "@/components/dashboard/stats-cards";
import { supabase } from "@/lib/supabase";

// --- Types -----------------------------------------------------------------

type DashboardForm = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  whatsapp_number: string;
  is_active: boolean;
  created_at: string;
  response_count?: number;
  responses_last_7d?: number;
};

// --- Helpers ---------------------------------------------------------------

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString();
}

// --- Page ------------------------------------------------------------------

export default function DashboardPage() {
  const [forms, setForms] = useState<DashboardForm[]>([]);
  const [responseStats, setResponseStats] = useState<{
    total: number;
    last7d: number;
  }>({ total: 0, last7d: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const [copiedFormId, setCopiedFormId] = useState("");
  const [deletingFormId, setDeletingFormId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadForms() {
      setIsLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (userError || !user) {
        console.error("Failed to resolve auth user", userError);
        setError("Failed to load forms.");
        setForms([]);
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("forms")
        .select(
          "id, title, slug, description, whatsapp_number, is_active, created_at",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (fetchError) {
        console.error("Failed to load forms", fetchError);
        setError("Failed to load forms.");
        setForms([]);
      } else {
        setForms((data ?? []) as DashboardForm[]);
      }

      setIsLoading(false);
    }

    loadForms();

    return () => {
      cancelled = true;
    };
  }, []);

  // Pull response counts for the stats cards. Lightweight: only IDs + ts,
  // joined via RLS on `responses` (already form-owner scoped through the
  // form_id FK + the user's `forms` rows).
  useEffect(() => {
    if (forms.length === 0) {
      setResponseStats({ total: 0, last7d: 0 });
      return;
    }
    let cancelled = false;
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const formIds = forms.map((f) => f.id);

    supabase
      .from("responses")
      .select("id, submitted_at")
      .in("form_id", formIds)
      .then(({ data, error: respErr }) => {
        if (cancelled) return;
        if (respErr) {
          console.error("Failed to load response stats", respErr);
          setResponseStats({ total: 0, last7d: 0 });
          return;
        }
        const rows = data ?? [];
        const last7d = rows.filter(
          (r) => r.submitted_at && r.submitted_at >= sevenDaysAgo,
        ).length;
        setResponseStats({ total: rows.length, last7d });
      });

    return () => {
      cancelled = true;
    };
  }, [forms]);

  // Stats derived from forms + response counts.
  const stats: DashboardStats = useMemo(
    () => ({
      totalForms: forms.length,
      activeForms: forms.filter((f) => f.is_active).length,
      totalResponses: responseStats.total,
      responsesLast7Days: responseStats.last7d,
    }),
    [forms, responseStats],
  );

  async function handleCopyLink(formId: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFormId(formId);
      window.setTimeout(() => {
        setCopiedFormId((current) => (current === formId ? "" : current));
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link", err);
    }
  }

  // Safe delete with browser confirm + ownership-scoped DELETE.
  // form_fields and responses cascade via FK ON DELETE CASCADE in
  // supabase/schema.sql, so a single DELETE on `forms` is enough.
  async function handleDeleteForm(form: DashboardForm) {
    const confirmed = window.confirm(
      "Delete this form? This will also remove its fields and responses.",
    );
    if (!confirmed) return;

    setDeleteError("");
    setDeleteSuccessMessage("");
    setDeletingFormId(form.id);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Failed to resolve auth user", userError);
      setDeleteError("Please login again.");
      setDeletingFormId(null);
      return;
    }

    const { error: deleteErr } = await supabase
      .from("forms")
      .delete()
      .eq("id", form.id)
      .eq("user_id", user.id);

    if (deleteErr) {
      console.error("Failed to delete form", deleteErr);
      setDeleteError("Failed to delete form. Please try again.");
      setDeletingFormId(null);
      return;
    }

    setForms((prev) => prev.filter((item) => item.id !== form.id));
    setDeleteSuccessMessage("Form deleted.");
    setDeletingFormId(null);
    window.setTimeout(() => {
      setDeleteSuccessMessage((current) =>
        current === "Form deleted." ? "" : current,
      );
    }, 2500);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
            My Forms
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-gray-600">
            Manage your WhatsApp forms, links, QR codes, and responses.
          </p>
        </div>

        <ButtonLink
          href="/dashboard/forms/new"
          variant="primary"
          className="!py-2.5 !px-4 !text-sm"
        >
          + Create New Form
        </ButtonLink>
      </header>

      {/* Stats overview */}
      <div className="mt-6">
        <StatsCards stats={stats} isLoading={isLoading} />
      </div>

      {/* Delete feedback banners */}
      {deleteError && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {deleteError}
        </div>
      )}
      {deleteSuccessMessage && (
        <div
          role="status"
          className="mt-6 rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-dark"
        >
          {deleteSuccessMessage}
        </div>
      )}

      {/* Body */}
      <div className="mt-10">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : forms.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="flex flex-col gap-5">
            {forms.map((form) => {
              const publicFormUrl = origin
                ? `${origin}/form/${form.slug}`
                : `/form/${form.slug}`;
              const isCopied = copiedFormId === form.id;
              const isDeleting = deletingFormId === form.id;
              return (
                <FormCard
                  key={form.id}
                  form={form}
                  publicFormUrl={publicFormUrl}
                  isCopied={isCopied}
                  isDeleting={isDeleting}
                  onCopy={() => handleCopyLink(form.id, publicFormUrl)}
                  onDelete={() => handleDeleteForm(form)}
                  origin={origin}
                />
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// --- Sub-components -------------------------------------------------------

function LoadingState() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
      Loading forms...
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600"
    >
      {message}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-gray-300 bg-gradient-to-br from-brand/5 via-white to-white p-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand-dark">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden
        >
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </svg>
      </div>
      <h2 className="mt-5 text-lg font-semibold text-black">No forms yet.</h2>
      <p className="mt-2 text-sm text-gray-500">
        Create your first WhatsApp form to get started.
      </p>
      <div className="mt-6 flex justify-center">
        <ButtonLink href="/dashboard/forms/new" variant="primary">
          Create New Form
        </ButtonLink>
      </div>
    </div>
  );
}

type FormCardProps = {
  form: DashboardForm;
  publicFormUrl: string;
  isCopied: boolean;
  isDeleting: boolean;
  onCopy: () => void;
  onDelete: () => void;
  origin: string;
};

function FormCard({
  form,
  publicFormUrl,
  isCopied,
  isDeleting,
  onCopy,
  onDelete,
  origin,
}: FormCardProps) {
  return (
    <li className="group rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-brand/30 hover:shadow-md sm:p-8">
      {/* Top: title + meta */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-xl font-bold tracking-tight text-black">
              {form.title}
            </h2>
            <span
              className={
                form.is_active
                  ? "shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-dark"
                  : "shrink-0 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500"
              }
            >
              {form.is_active ? "Active" : "Inactive"}
            </span>
          </div>
          {form.description && (
            <p className="mt-1.5 text-sm text-gray-600">{form.description}</p>
          )}
        </div>
        <p className="shrink-0 text-xs text-gray-400 sm:text-right">
          Created {formatDate(form.created_at)}
        </p>
      </div>

      {/* Middle: meta grid */}
      <dl className="mt-5 grid grid-cols-1 gap-3 rounded-2xl bg-gray-50 p-4 text-xs sm:grid-cols-3 sm:gap-6">
        <div className="min-w-0">
          <dt className="font-semibold uppercase tracking-wide text-gray-500">
            Slug
          </dt>
          <dd className="mt-1 truncate font-mono text-black">{form.slug}</dd>
        </div>
        <div className="min-w-0">
          <dt className="font-semibold uppercase tracking-wide text-gray-500">
            WhatsApp
          </dt>
          <dd className="mt-1 truncate font-mono text-black">
            {form.whatsapp_number}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="font-semibold uppercase tracking-wide text-gray-500">
            Responses
          </dt>
          <dd className="mt-1">
            <Link
              href={`/dashboard/forms/${form.id}/responses`}
              className="font-medium text-brand-dark underline-offset-2 hover:underline"
            >
              View submissions →
            </Link>
          </dd>
        </div>
      </dl>

      {/* Share row: link + QR */}
      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Public Form Link
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-1.5">
            <code className="flex-1 truncate px-2 font-mono text-xs text-black">
              {publicFormUrl}
            </code>
            <button
              type="button"
              onClick={onCopy}
              disabled={!origin}
              className="shrink-0 rounded-xl bg-black px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-gray-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCopied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 sm:flex-col sm:items-end">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 sm:flex-col sm:gap-1">
            {/* QR is 120px on mobile (easier cross-device scan) and 96px
                on desktop where the card has less vertical room. */}
            <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-white sm:h-24 sm:w-24">
              {origin ? (
                <QRCodeSVG
                  value={publicFormUrl}
                  size={120}
                  level="M"
                  className="h-full w-full"
                />
              ) : (
                <div className="h-full w-full animate-pulse rounded bg-gray-100" />
              )}
            </div>
            <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400 sm:text-center">
              Scan to open
            </span>
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-2 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
        <ButtonLink
          href={`/form/${form.slug}`}
          variant="secondary"
          className="!py-2 !px-4 !text-sm"
        >
          View Public Form
        </ButtonLink>
        <ButtonLink
          href={`/dashboard/forms/${form.id}/edit`}
          variant="secondary"
          className="!py-2 !px-4 !text-sm"
        >
          Edit
        </ButtonLink>
        <ButtonLink
          href={`/dashboard/forms/${form.id}/responses`}
          variant="primary"
          className="!py-2 !px-4 !text-sm"
        >
          Responses
        </ButtonLink>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label={`Delete form ${form.title}`}
          className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:border-red-300 hover:bg-red-100 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </li>
  );
}
