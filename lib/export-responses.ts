/**
 * Export helpers for the FormWhats Responses page.
 *
 * These utilities turn the in-memory list of filtered responses into a
 * downloadable CSV or XLSX file. They are intentionally framework-free
 * so the page can call them after applying the user's search/date
 * filters.
 */

import * as XLSX from "xlsx";

import type { FormField, Response as FormResponse } from "@/types/database";

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export type ExportableForm = {
  id: string;
  title: string;
  slug: string;
};

// ---------------------------------------------------------------------------
// Answer lookup
// ---------------------------------------------------------------------------

/**
 * Resolve the answer for a given field on a given response.
 *
 * Older responses store answers keyed by `field.id`. Newer payloads may
 * use `field.field_key` or even the human label. We try each in order
 * and fall back to "-" so the table never renders `undefined`.
 */
export function getAnswer(
  response: Pick<FormResponse, "data_json">,
  field: Pick<FormField, "id" | "field_key" | "label">,
): string {
  const data = response.data_json ?? {};

  const candidates = [
    data[field.id],
    data[field.field_key],
    data[field.label],
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate;
    }
    if (typeof candidate === "number" || typeof candidate === "boolean") {
      return String(candidate);
    }
  }

  return "-";
}

// ---------------------------------------------------------------------------
// Filename helpers
// ---------------------------------------------------------------------------

function todayStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "form"
  );
}

export function buildExportFilename(
  form: ExportableForm,
  ext: "csv" | "xlsx",
): string {
  return `${slugifyTitle(form.title)}-responses-${todayStamp()}.${ext}`;
}

// ---------------------------------------------------------------------------
// Row building
// ---------------------------------------------------------------------------

export type ExportRow = Record<string, string>;

/**
 * Turn a list of responses into a flat array of objects suitable for
 * CSV or XLSX export. Keys are header labels; values are stringified.
 */
export function buildExportRows(
  responses: FormResponse[],
  fields: FormField[],
  options?: { startNumber?: number },
): ExportRow[] {
  // Newest first (matches the on-screen order). Numbering counts down so
  // the newest row is "#N" and the oldest is "#1".
  const total = responses.length;
  const startNumber = options?.startNumber ?? total;

  return responses.map((response, index) => {
    const row: ExportRow = {};
    row["Response"] = `#${startNumber - index}`;
    row["Submitted Time"] = formatTimestamp(response.submitted_at);

    for (const field of fields) {
      row[field.label] = getAnswer(response, field);
    }

    row["WhatsApp Message"] = response.whatsapp_message ?? "";
    return row;
  });
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

/** Escape a cell for RFC 4180 compliant CSV. */
function escapeCsvCell(value: string): string {
  // Wrap in quotes when the value has a comma, quote, or line break.
  // Existing quotes are doubled per RFC 4180.
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(rows: ExportRow[], headers: string[]): string {
  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(","));

  for (const row of rows) {
    const cells = headers.map((header) => escapeCsvCell(row[header] ?? ""));
    lines.push(cells.join(","));
  }

  return lines.join("\r\n");
}

export function downloadCsv(
  form: ExportableForm,
  responses: FormResponse[],
  fields: FormField[],
): void {
  const rows = buildExportRows(responses, fields);
  const headers = [
    "Response",
    "Submitted Time",
    ...fields.map((field) => field.label),
    "WhatsApp Message",
  ];

  const csv = buildCsv(rows, headers);
  // Prepend BOM so Excel opens UTF-8 files (with emojis etc.) correctly.
  const blob = new Blob(["\ufeff" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  triggerBrowserDownload(blob, buildExportFilename(form, "csv"));
}

// ---------------------------------------------------------------------------
// XLSX export
// ---------------------------------------------------------------------------

export function downloadXlsx(
  form: ExportableForm,
  responses: FormResponse[],
  fields: FormField[],
): void {
  const rows = buildExportRows(responses, fields);
  const headers = [
    "Response",
    "Submitted Time",
    ...fields.map((field) => field.label),
    "WhatsApp Message",
  ];

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  // Reasonable default widths so the file looks nice on first open.
  worksheet["!cols"] = headers.map((header) => ({
    wch: Math.min(Math.max(header.length + 2, 14), 40),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Responses");

  const arrayBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;

  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  triggerBrowserDownload(blob, buildExportFilename(form, "xlsx"));
}

// ---------------------------------------------------------------------------
// Browser download primitive
// ---------------------------------------------------------------------------

function triggerBrowserDownload(blob: Blob, filename: string): void {
  if (typeof window === "undefined") return;

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Defer revoke so Safari has time to start the download.
  window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
}
