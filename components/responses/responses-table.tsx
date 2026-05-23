"use client";

/**
 * Spreadsheet-style table for the FormWhats Responses page.
 *
 * - Sticky header with subtle gray background
 * - Horizontal scroll when there are many fields
 * - Selectable rows (checkbox + select-all)
 * - Phone numbers render as green tel: / wa.me links
 * - Emails render as green mailto: links
 * - WhatsApp message column is truncated with "view" toggle per row
 *
 * The page owns selection state and filtering; this component just
 * renders what it's told and emits selection toggles.
 */

import { useState } from "react";

import type { FormField, Response as FormResponse } from "@/types/database";
import { getAnswer } from "@/lib/export-responses";

type ResponsesTableProps = {
  responses: FormResponse[];
  fields: FormField[];
  // Map response.id -> display number (e.g. #12). Computed by the page so
  // numbering stays stable even when the list is filtered.
  responseNumberById: Record<string, number>;
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: () => void;
};

const PHONE_REGEX = /^\+?[0-9][0-9\s\-().]{6,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const headerCellClass =
  "sticky top-0 z-10 whitespace-nowrap border-b border-gray-200 bg-white px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500";

const bodyCellClass =
  "whitespace-nowrap border-b border-r border-gray-100 px-5 py-5 text-sm text-black last:border-r-0";

export default function ResponsesTable({
  responses,
  fields,
  responseNumberById,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: ResponsesTableProps) {
  const allSelected =
    responses.length > 0 && responses.every((r) => selectedIds.has(r.id));
  const someSelected =
    !allSelected && responses.some((r) => selectedIds.has(r.id));

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className={`${headerCellClass} w-12`} scope="col">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={onToggleAll}
                className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand focus:ring-brand"
                aria-label="Select all responses"
              />
            </th>
            <th
              className={`${headerCellClass} min-w-[120px]`}
              scope="col"
            >
              Response
            </th>
            <th
              className={`${headerCellClass} min-w-[200px]`}
              scope="col"
            >
              Time
            </th>
            {fields.map((field) => (
              <th
                key={field.id}
                className={`${headerCellClass} min-w-[180px]`}
                scope="col"
              >
                {field.label}
              </th>
            ))}
            <th
              className={`${headerCellClass} min-w-[200px]`}
              scope="col"
            >
              WhatsApp Message
            </th>
          </tr>
        </thead>
        <tbody>
          {responses.map((response) => {
            const isSelected = selectedIds.has(response.id);
            return (
              <ResponseRow
                key={response.id}
                response={response}
                fields={fields}
                isSelected={isSelected}
                responseNumber={responseNumberById[response.id]}
                onToggle={() => onToggleRow(response.id)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

type ResponseRowProps = {
  response: FormResponse;
  fields: FormField[];
  isSelected: boolean;
  responseNumber: number | undefined;
  onToggle: () => void;
};

function ResponseRow({
  response,
  fields,
  isSelected,
  responseNumber,
  onToggle,
}: ResponseRowProps) {
  const [showMessage, setShowMessage] = useState(false);

  const rowClass = isSelected
    ? "bg-brand/5 hover:bg-brand/10"
    : "hover:bg-gray-50";

  return (
    <tr className={`transition-colors ${rowClass}`}>
      <td className={`${bodyCellClass} w-12`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand focus:ring-brand"
          aria-label="Select response"
        />
      </td>
      <td className={`${bodyCellClass} font-mono text-xs text-gray-600`}>
        {responseNumber !== undefined
          ? `#${responseNumber}`
          : `#${response.id.slice(-5)}`}
      </td>
      <td className={`${bodyCellClass} text-gray-600`}>
        {formatTimestamp(response.submitted_at)}
      </td>

      {fields.map((field) => {
        const value = getAnswer(response, field);
        return (
          <td key={field.id} className={bodyCellClass}>
            <SmartCell value={value} fieldType={field.field_type} />
          </td>
        );
      })}

      <td className={bodyCellClass}>
        {response.whatsapp_message ? (
          <button
            type="button"
            onClick={() => setShowMessage((prev) => !prev)}
            className="max-w-[260px] truncate text-left text-xs text-gray-600 underline-offset-2 hover:text-black hover:underline"
            title={response.whatsapp_message}
          >
            {showMessage
              ? response.whatsapp_message
              : truncate(response.whatsapp_message, 60)}
          </button>
        ) : (
          <span className="text-gray-400">-</span>
        )}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Cell rendering helpers
// ---------------------------------------------------------------------------

function SmartCell({
  value,
  fieldType,
}: {
  value: string;
  fieldType: string;
}) {
  if (value === "-" || value === "") {
    return <span className="text-gray-400">-</span>;
  }

  // Phone: explicit field type or pattern match
  if (fieldType === "phone" || looksLikePhone(value)) {
    return <PhoneLink value={value} />;
  }

  // Email: explicit field type or pattern match
  if (fieldType === "email" || EMAIL_REGEX.test(value.trim())) {
    return <EmailLink value={value} />;
  }

  return <span className="break-words">{value}</span>;
}

function PhoneLink({ value }: { value: string }) {
  const digits = value.replace(/[^\d+]/g, "");
  // wa.me does not accept leading "+", strip it for the WhatsApp link.
  const waNumber = digits.replace(/^\+/, "");
  const telHref = digits.startsWith("+") ? `tel:${digits}` : `tel:+${digits}`;
  const waHref = `https://wa.me/${waNumber}`;

  return (
    <span className="inline-flex items-center gap-2">
      <a
        href={telHref}
        className="font-medium text-brand-dark underline-offset-2 hover:underline"
      >
        {value}
      </a>
      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-brand-dark/70 hover:text-brand-dark"
        aria-label="Open in WhatsApp"
        title="Open in WhatsApp"
      >
        ↗
      </a>
    </span>
  );
}

function EmailLink({ value }: { value: string }) {
  return (
    <a
      href={`mailto:${value.trim()}`}
      className="font-medium text-brand-dark underline-offset-2 hover:underline"
    >
      {value}
    </a>
  );
}

function looksLikePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!PHONE_REGEX.test(trimmed)) return false;
  // Require enough digits to actually be a phone number.
  const digitCount = (trimmed.match(/\d/g) ?? []).length;
  return digitCount >= 7;
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}…`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
