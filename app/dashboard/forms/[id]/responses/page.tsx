"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import ResponsesTable from "@/components/responses/responses-table";
import ResponsesToolbar from "@/components/responses/responses-toolbar";
import {
  downloadCsv,
  downloadXlsx,
  getAnswer,
} from "@/lib/export-responses";
import { supabase } from "@/lib/supabase";
import type { FormField, Response as FormResponse } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type FormDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  whatsapp_number: string;
};

type ResponsesPageProps = {
  params: { id: string };
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ResponsesPage({ params }: ResponsesPageProps) {
  const formId = params?.id ?? "";

  const [form, setForm] = useState<FormDetail | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ----- Data loading ---------------------------------------------------

  const loadAll = useCallback(
    async (mode: "initial" | "reload") => {
      if (mode === "initial") setIsLoading(true);
      else setIsReloading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Failed to resolve auth user", userError);
        setError("Failed to load responses.");
        if (mode === "initial") setIsLoading(false);
        else setIsReloading(false);
        return;
      }

      const { data: formData, error: formErr } = await supabase
        .from("forms")
        .select("id, title, slug, description, whatsapp_number")
        .eq("id", formId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (formErr) {
        console.error("Failed to load form", formErr);
        setError("Failed to load responses.");
        if (mode === "initial") setIsLoading(false);
        else setIsReloading(false);
        return;
      }

      if (!formData) {
        setForm(null);
        setFields([]);
        setResponses([]);
        if (mode === "initial") setIsLoading(false);
        else setIsReloading(false);
        return;
      }

      setForm(formData as FormDetail);

      const [fieldsResult, responsesResult] = await Promise.all([
        supabase
          .from("form_fields")
          .select(
            "id, form_id, label, field_key, field_type, required, sort_order, created_at",
          )
          .eq("form_id", formId)
          .order("sort_order", { ascending: true }),
        supabase
          .from("responses")
          .select("id, form_id, data_json, whatsapp_message, submitted_at")
          .eq("form_id", formId)
          .order("submitted_at", { ascending: false }),
      ]);

      if (fieldsResult.error || responsesResult.error) {
        console.error(
          "Failed to load fields/responses",
          fieldsResult.error,
          responsesResult.error,
        );
        setError("Failed to load responses.");
      } else {
        setFields((fieldsResult.data ?? []) as FormField[]);
        setResponses((responsesResult.data ?? []) as FormResponse[]);
        // Drop any selections that no longer exist after reload.
        setSelectedIds((prev) => {
          const ids = new Set(
            (responsesResult.data ?? []).map((r: { id: string }) => r.id),
          );
          const next = new Set<string>();
          prev.forEach((id) => {
            if (ids.has(id)) next.add(id);
          });
          return next;
        });
      }

      if (mode === "initial") setIsLoading(false);
      else setIsReloading(false);
    },
    [formId],
  );

  useEffect(() => {
    void loadAll("initial");
  }, [loadAll]);

  // Auto-dismiss banner
  useEffect(() => {
    if (!banner) return;
    const timer = window.setTimeout(() => setBanner(null), 3000);
    return () => window.clearTimeout(timer);
  }, [banner]);

  // ----- Stable response numbering --------------------------------------
  // Numbering is based on the full list (newest = highest number) so a
  // given response always shows the same #N regardless of filters.
  const responseNumberById = useMemo(() => {
    const map: Record<string, number> = {};
    const total = responses.length;
    responses.forEach((r, index) => {
      map[r.id] = total - index;
    });
    return map;
  }, [responses]);

  // ----- Filtering ------------------------------------------------------
  const filteredResponses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const fromTs = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTs = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : null;

    return responses.filter((response) => {
      const submittedTs = new Date(response.submitted_at).getTime();
      if (fromTs !== null && submittedTs < fromTs) return false;
      if (toTs !== null && submittedTs > toTs) return false;

      if (!query) return true;

      const haystack: string[] = [
        response.id,
        responseNumberById[response.id]
          ? `#${responseNumberById[response.id]}`
          : "",
        new Date(response.submitted_at).toLocaleString(),
        response.whatsapp_message ?? "",
      ];
      for (const field of fields) {
        haystack.push(getAnswer(response, field));
      }

      return haystack.join(" \u0001 ").toLowerCase().includes(query);
    });
  }, [responses, fields, searchQuery, fromDate, toDate, responseNumberById]);

  // ----- Selection ------------------------------------------------------
  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected =
        filteredResponses.length > 0 &&
        filteredResponses.every((r) => prev.has(r.id));
      if (allSelected) {
        const next = new Set(prev);
        filteredResponses.forEach((r) => next.delete(r.id));
        return next;
      }
      const next = new Set(prev);
      filteredResponses.forEach((r) => next.add(r.id));
      return next;
    });
  }, [filteredResponses]);

  // ----- Delete selected ------------------------------------------------
  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0 || !form) return;
    const confirmed = window.confirm("Delete selected responses?");
    if (!confirmed) return;

    setIsDeleting(true);

    const ids = Array.from(selectedIds);
    const { error: deleteErr } = await supabase
      .from("responses")
      .delete()
      .eq("form_id", form.id)
      .in("id", ids);

    setIsDeleting(false);

    if (deleteErr) {
      console.error("Failed to delete responses", deleteErr);
      setBanner({
        kind: "error",
        text: "Failed to delete responses. Please try again.",
      });
      return;
    }

    setResponses((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setSelectedIds(new Set());
    setBanner({ kind: "success", text: "Responses deleted." });
  }, [form, selectedIds]);

  // ----- Exports --------------------------------------------------------
  const handleExportCsv = useCallback(() => {
    if (!form) return;
    downloadCsv(form, filteredResponses, fields);
  }, [form, filteredResponses, fields]);

  const handleExportXlsx = useCallback(() => {
    if (!form) return;
    downloadXlsx(form, filteredResponses, fields);
  }, [form, filteredResponses, fields]);

  // ----- Render guards --------------------------------------------------
  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Loading responses...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600"
        >
          Failed to load responses.
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-black">Form not found.</h1>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-sm font-medium text-brand-dark underline-offset-2 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ----- Main render ----------------------------------------------------
  const hasResponses = responses.length > 0;
  const hasFilteredResults = filteredResponses.length > 0;

  return (
    <div className="min-h-screen bg-white">
      <PageHeader form={form} />

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-5 sm:px-6">
        {banner && (
          <div
            role="status"
            className={
              banner.kind === "success"
                ? "mb-4 rounded-xl border border-brand/30 bg-brand/10 px-4 py-2.5 text-sm text-brand-dark"
                : "mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600"
            }
          >
            {banner.text}
          </div>
        )}

        <ResponsesToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          fromDate={fromDate}
          toDate={toDate}
          onFromDateChange={setFromDate}
          onToDateChange={setToDate}
          selectedCount={selectedIds.size}
          onDeleteSelected={handleDeleteSelected}
          onExportCsv={handleExportCsv}
          onExportXlsx={handleExportXlsx}
          onReload={() => void loadAll("reload")}
          isReloading={isReloading}
          isDeleting={isDeleting}
        />

        <div className="mt-4">
          {!hasResponses ? (
            <EmptyCard text="No responses yet." />
          ) : !hasFilteredResults ? (
            <EmptyCard text="No responses match your filters." />
          ) : (
            <ResponsesTable
              responses={filteredResponses}
              fields={fields}
              responseNumberById={responseNumberById}
              selectedIds={selectedIds}
              onToggleRow={toggleRow}
              onToggleAll={toggleAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function PageHeader({ form }: { form: FormDetail }) {
  return (
    <header className="bg-white">
      {/* Row 1: back + title + secondary nav placeholders */}
      <div className="border-b border-gray-100">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard"
              aria-label="Back to Dashboard"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </Link>
            <h1 className="truncate text-base font-semibold uppercase tracking-wide text-black sm:text-lg">
              {form.title}
            </h1>
          </div>

          <div className="hidden items-center gap-5 text-sm text-gray-500 md:flex">
            <span className="inline-flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 0 20" />
                <path d="M12 2a15.3 15.3 0 0 0 0 20" />
              </svg>
              <span>EN</span>
            </span>
            <span>Help</span>
            <span>Account</span>
          </div>
        </div>
      </div>

      {/* Row 2: tabs (left) + Open / Settings (right) */}
      <div className="border-b border-gray-200">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-end justify-between gap-3 px-4 sm:px-6">
          <Tabs formId={form.id} slug={form.slug} />

          <div className="flex items-center gap-2 py-2">
            <Link
              href={`/form/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-black transition hover:bg-gray-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M10 14L21 3" />
                <path d="M21 9V3h-6" />
                <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
              </svg>
              Open
            </Link>
            <button
              type="button"
              onClick={() => window.alert("Settings will be added later.")}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.36.16.66.43.86.79a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Tabs({ formId, slug }: { formId: string; slug: string }) {
  const tabBase =
    "inline-flex items-center gap-2 border-b-2 px-2 py-3 text-sm font-medium transition";
  const inactive = `${tabBase} border-transparent text-gray-600 hover:text-black`;
  const active = `${tabBase} border-brand text-black`;

  return (
    <nav
      className="flex items-center gap-6 sm:gap-8"
      aria-label="Form sections"
    >
      <Link href={`/dashboard/forms/${formId}/edit`} className={inactive}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        Build
      </Link>
      <Link
        href={`/form/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={inactive}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98" />
          <path d="M15.41 6.51l-6.82 3.98" />
        </svg>
        Share
      </Link>
      <span className={active} aria-current="page">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 10h18" />
        </svg>
        Responses
      </span>
    </nav>
  );
}

function EmptyCard({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500">
      {text}
    </div>
  );
}
