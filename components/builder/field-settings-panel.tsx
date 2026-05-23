"use client";

import { useRef, useState } from "react";
import { SparkleIcon } from "@/components/landing/icons";
import { supabase } from "@/lib/supabase";
import { uploadFieldImage } from "@/lib/upload-field-image";


// --- Types -----------------------------------------------------------------

export type SettingsFieldType =
  | "short_text"
  | "long_text"
  | "phone"
  | "email"
  | "number"
  | "date"
  | "dropdown";

export type SettingsField = {
  id: string;
  label: string;
  type: SettingsFieldType;
  required: boolean;
  options?: string[];
  image_url?: string;
};

const FIELD_TYPE_OPTIONS: { value: SettingsFieldType; label: string }[] = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
];

type FieldSettingsPanelProps = {
  /** The field currently selected in the canvas. Null when nothing selected. */
  selectedField: SettingsField | null;
  /** Optional: 1-based index of the selected field in the canvas. Used to
   *  show "Field 3" sub-label in the panel header for context. */
  selectedFieldIndex?: number;
  /**
   * Callback fired whenever any property of the selected field changes.
   * Pages should setFields(prev => prev.map(...)) using the returned object.
   */
  onUpdateField?: (updated: SettingsField) => void;
  /** Optional: clear the selection (e.g. when user wants to deselect). */
  onClearSelection?: () => void;
  /** Optional: delete the selected field from the canvas. Wired up to a
   *  subtle danger button at the bottom of the panel. The page-level
   *  handler is responsible for confirmation + removal from state. */
  onDeleteField?: (id: string) => void;
};

// --- Empty state ---------------------------------------------------------

function EmptyState() {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-black">
          Field Settings
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          Edit the selected question.
        </p>
      </header>

      <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 px-5 py-8 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand/10 text-brand-dark">
          <SparkleIcon className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-semibold text-black">
          No field selected
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
          Click a question on the canvas, or drag a new question from the
          left panel to start editing.
        </p>
      </div>
    </aside>
  );
}

// --- Main panel ----------------------------------------------------------

export default function FieldSettingsPanel({
  selectedField,
  selectedFieldIndex,
  onUpdateField,
  onClearSelection,
  onDeleteField,
}: FieldSettingsPanelProps) {
  if (!selectedField) {
    return <EmptyState />;
  }

  const labelMissing = selectedField.label.trim() === "";
  const labelLength = selectedField.label.length;
  const labelMax = 80;
  const fieldTypeOption = FIELD_TYPE_OPTIONS.find(
    (opt) => opt.value === selectedField.type,
  );

  // Image-only field: a field whose only purpose is to display a picture
  // on the public form (banner, divider, hero image). Detected by either
  // an empty label or the legacy "Image question" placeholder, combined
  // with a non-empty image_url. These fields skip label / type / required
  // / dropdown editing -- the user is only here to manage the picture.
  const isImageOnly =
    !!selectedField.image_url &&
    selectedField.image_url.trim() !== "" &&
    (selectedField.label.trim() === "" ||
      selectedField.label.trim() === "Image question");

  function update(patch: Partial<SettingsField>) {
    if (!selectedField || !onUpdateField) return;
    onUpdateField({ ...selectedField, ...patch });
  }

  // Image-only field: simplified panel that only shows the image editor
  // (upload / replace / remove). No label, no field type, no required,
  // no dropdown options. The picture is the whole story.
  if (isImageOnly) {
    return (
      <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-black">
              Image
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              Replace or remove this image.
            </p>
          </div>
          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="shrink-0 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-black"
            >
              Deselect
            </button>
          )}
        </header>
        <div className="mt-5">
          <ImageUrlEditor
            imageUrl={selectedField.image_url ?? ""}
            onChange={(next) => {
              // When the image is removed entirely, also clear the legacy
              // "Image question" label so the canvas card collapses to a
              // normal empty short_text instead of looking like a stuck
              // image placeholder.
              if (next.trim() === "") {
                update({ image_url: "", label: "" });
              } else {
                update({ image_url: next });
              }
            }}
          />
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-black">
              Field Settings
            </h2>
            {typeof selectedFieldIndex === "number" && (
              <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-600">
                Field {selectedFieldIndex}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
              {fieldTypeOption?.label ?? "Field"}
            </span>
            <p
              className="min-w-0 truncate text-xs text-gray-500"
              title={selectedField.label}
            >
              {selectedField.label.trim() === ""
                ? "Untitled"
                : selectedField.label}
            </p>
          </div>
        </div>

        {onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            aria-label="Close field settings"
            className="shrink-0 rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:border-gray-300 hover:text-black"
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
        )}
      </header>

      <div className="mt-5 flex flex-col">
        {/* Section: Content */}
        <SectionHeader>Content</SectionHeader>
        <div className="flex flex-col gap-4">
          {/* Label */}
          <div>
            <div className="flex items-baseline justify-between">
              <label
                htmlFor="settings-label"
                className="text-xs font-semibold text-black"
              >
                Field label
              </label>
              <span
                className={[
                  "text-[10px] tabular-nums",
                  labelLength > labelMax
                    ? "text-amber-600"
                    : "text-gray-400",
                ].join(" ")}
              >
                {labelLength}/{labelMax}
              </span>
            </div>
            <input
              id="settings-label"
              type="text"
              maxLength={labelMax}
              value={selectedField.label}
              onChange={(e) => update({ label: e.target.value })}
              placeholder="e.g. Full Name"
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            />
            {labelMissing ? (
              <p className="mt-1 text-[11px] text-amber-600">
                Field label should not be empty.
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-400">
                The question shown to your customer above the input.
              </p>
            )}
          </div>

          {/* Type */}
          <div>
            <label
              htmlFor="settings-type"
              className="text-xs font-semibold text-black"
            >
              Field type
            </label>
            <select
              id="settings-type"
              value={selectedField.type}
              onChange={(e) =>
                update({ type: e.target.value as SettingsFieldType })
              }
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
            >
              {FIELD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-gray-400">
              Controls the input type shown on the public form.
            </p>
          </div>
        </div>

        {/* Section: Behavior */}
        <SectionHeader>Behavior</SectionHeader>
        <button
          type="button"
          role="switch"
          aria-checked={selectedField.required}
          onClick={() => update({ required: !selectedField.required })}
          className={[
            "flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/30",
            selectedField.required
              ? "border-brand/30 bg-brand/5"
              : "border-gray-200 bg-white hover:border-gray-300",
          ].join(" ")}
        >
          <span className="min-w-0">
            <span className="block text-xs font-semibold text-black">
              Required
            </span>
            <span
              className={[
                "mt-0.5 block text-[11px]",
                selectedField.required ? "text-brand-dark" : "text-gray-500",
              ].join(" ")}
            >
              {selectedField.required
                ? "Customer must answer."
                : "Optional answer."}
            </span>
          </span>
          {/* Track */}
          <span
            aria-hidden
            className={[
              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200",
              selectedField.required ? "bg-brand" : "bg-gray-300",
            ].join(" ")}
          >
            {/* Thumb */}
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-200",
                selectedField.required
                  ? "translate-x-[18px]"
                  : "translate-x-0.5",
              ].join(" ")}
            />
          </span>
        </button>

        {/* Section: Options (dropdown only) */}
        {selectedField.type === "dropdown" && (
          <>
            <SectionHeader>Options</SectionHeader>
            <DropdownOptionsEditor
              options={selectedField.options ?? []}
              onChange={(next) => update({ options: next })}
            />
          </>
        )}

        {/* Section: Image */}
        <SectionHeader>Image</SectionHeader>
        <ImageUrlEditor
          imageUrl={selectedField.image_url ?? ""}
          onChange={(next) => update({ image_url: next })}
        />

        {/* Section: Preview */}
        <SectionHeader>Preview</SectionHeader>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <FieldPreview field={selectedField} />
        </div>

        {/* Danger zone: Delete field */}
        {onDeleteField && (
          <div className="mt-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={() => onDeleteField(selectedField.id)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3.5 w-3.5"
                aria-hidden
              >
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
              Delete field
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

// --- Section header (small caps divider used inside the panel) ----------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 mt-5 text-[10px] font-semibold uppercase tracking-wider text-gray-500 first:mt-0">
      {children}
    </p>
  );
}

// --- Dropdown options editor --------------------------------------------

function DropdownOptionsEditor({
  options,
  onChange,
}: {
  options: string[];
  onChange: (next: string[]) => void;
}) {
  function updateAt(index: number, value: string) {
    const next = options.slice();
    next[index] = value;
    onChange(next);
  }
  function removeAt(index: number) {
    onChange(options.filter((_, i) => i !== index));
  }
  function addOne() {
    onChange([...options, `Option ${options.length + 1}`]);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Dropdown Options
        </p>
        <span className="text-[10px] text-gray-400">
          {options.length} option{options.length === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {options.length === 0 && (
          <li className="rounded-lg border border-dashed border-gray-300 bg-white px-2.5 py-2 text-[11px] text-gray-500">
            No options yet. Add at least one.
          </li>
        )}
        {options.map((opt, index) => {
          const empty = opt.trim() === "";
          return (
            <li key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-[10px] font-semibold text-gray-400">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateAt(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-black placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  aria-label={`Remove option ${index + 1}`}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:bg-red-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-3 w-3"
                    aria-hidden
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
              {empty && (
                <p className="ml-7 text-[10px] text-amber-600">
                  Option label should not be empty.
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={addOne}
        className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-dashed border-brand/40 bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition-colors hover:border-brand hover:bg-brand/5"
      >
        + Add Option
      </button>
    </div>
  );
}

// --- Image editor (upload + manual URL) ----------------------------------

/**
 * Image editor for a question field.
 *
 * Supports two paths:
 *   1. Upload Image -- uploads to Supabase Storage bucket `form-images`
 *      and writes the resulting public URL back to the field.
 *   2. (Advanced) Paste image URL -- kept for power users who want to
 *      reference an externally hosted image without uploading.
 */
function ImageUrlEditor({
  imageUrl,
  onChange,
}: {
  imageUrl: string;
  onChange: (next: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const hasImage = imageUrl.trim() !== "";

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be re-selected after a failed
    // upload (browsers ignore a "change" event for an identical value).
    e.target.value = "";
    if (!file) return;

    setUploadError("");
    setIsUploading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setUploadError("Please login again to upload images.");
        setIsUploading(false);
        return;
      }

      const publicUrl = await uploadFieldImage(file, user.id);
      onChange(publicUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload image.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleUploadClick() {
    if (isUploading) return;
    fileInputRef.current?.click();
  }

  function handleRemove() {
    setUploadError("");
    onChange("");
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
        Question Image
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
        Upload an image for this field. It will appear above the question on
        the public form.
      </p>

      {/* Hidden native file input -- driven by the styled button below. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Upload button */}
      <button
        type="button"
        onClick={handleUploadClick}
        disabled={isUploading}
        className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-brand/40 bg-white px-3 py-2 text-xs font-medium text-brand-dark transition-colors hover:border-brand hover:bg-brand/5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isUploading ? (
          "Uploading..."
        ) : (
          <>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden
            >
              <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            {hasImage ? "Replace Image" : "Upload Image"}
          </>
        )}
      </button>

      {uploadError && (
        <p
          role="alert"
          className="mt-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-600"
        >
          {uploadError}
        </p>
      )}

      {/* Preview */}
      {hasImage && (
        <div className="mt-2 flex flex-col gap-2">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Question preview"
              className="block max-h-32 w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="self-end rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-600 transition-colors hover:bg-red-100"
          >
            Remove Image
          </button>
        </div>
      )}

      {/* Advanced: manual image URL paste -- kept for power users / migrations */}
      <details className="mt-3 group">
        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wide text-gray-400 transition-colors hover:text-gray-600">
          Or paste image URL
        </summary>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-black placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      </details>
    </div>
  );
}


// --- Read-only preview rendered in the panel -----------------------------

function FieldPreview({ field }: { field: SettingsField }) {
  const previewLabel =
    field.label.trim() === "" ? "Field label" : field.label.trim();
  const sharedInputClass =
    "mt-1 block w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-500";

  if (field.type === "long_text") {
    return (
      <label className="block text-[11px] font-medium text-black">
        {previewLabel}
        {field.required && <span className="text-red-500">*</span>}
        <textarea
          rows={2}
          readOnly
          placeholder="Customer answer"
          className={`${sharedInputClass} resize-none`}
        />
      </label>
    );
  }

  if (field.type === "dropdown") {
    return (
      <label className="block text-[11px] font-medium text-black">
        {previewLabel}
        {field.required && <span className="text-red-500">*</span>}
        <select disabled className={sharedInputClass}>
          <option>Choose an option</option>
        </select>
      </label>
    );
  }

  const inputType =
    field.type === "phone"
      ? "tel"
      : field.type === "email"
        ? "email"
        : field.type === "number"
          ? "number"
          : field.type === "date"
            ? "date"
            : "text";

  return (
    <label className="block text-[11px] font-medium text-black">
      {previewLabel}
      {field.required && <span className="text-red-500">*</span>}
      <input
        type={inputType}
        readOnly
        placeholder="Customer answer"
        className={sharedInputClass}
      />
    </label>
  );
}
