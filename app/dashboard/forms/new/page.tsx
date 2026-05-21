"use client";

import { useEffect, useState } from "react";
import ButtonLink from "@/components/button-link";
import BuilderShell from "@/components/builder/builder-shell";
import BuilderTopbar from "@/components/builder/builder-topbar";
import FieldLibraryPanel, {
  type FieldTypeOption,
} from "@/components/builder/field-library-panel";
import FieldSettingsPanel from "@/components/builder/field-settings-panel";
import SortableFieldList from "@/components/builder/sortable-field-list";
import { supabase } from "@/lib/supabase";

// --- Types -----------------------------------------------------------------

type FormField = {
  id: string;
  label: string;
  type:
    | "short_text"
    | "long_text"
    | "phone"
    | "email"
    | "number"
    | "date"
    | "dropdown";
  required: boolean;
  options?: string[];
  image_url?: string;
};

const FIELD_TYPE_OPTIONS: { value: FormField["type"]; label: string }[] = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
];

function getFieldTypeLabel(type: FormField["type"]): string {
  return (
    FIELD_TYPE_OPTIONS.find((opt) => opt.value === type)?.label ?? "Short Text"
  );
}

function generateFieldId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString();
}

/**
 * Build a URL-safe slug from a form title.
 *   "Yunnan Travel Inquiry" -> "yunnan-travel-inquiry-1712345678"
 * A short timestamp suffix reduces duplicate-slug risk in the unique index.
 */
function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const safeBase = base === "" ? "untitled-form" : base;
  const suffix = Math.floor(Date.now() / 1000).toString();
  return `${safeBase}-${suffix}`;
}

/**
 * Build a simple snake_case key from a field label.
 * Falls back to the provided id if the label produces an empty key.
 */
function generateFieldKey(label: string, fallbackId: string): string {
  const key = label
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return key === "" ? fallbackId : key;
}

// --- Reusable class strings -----------------------------------------------

const inputClass =
  "mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

const labelClass = "text-sm font-medium text-black";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8";

const errorTextClass = "mt-1.5 text-xs text-red-600";

// --- Page ------------------------------------------------------------------

export default function NewFormPage() {
  // Form details state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Fields state
  const [fields, setFields] = useState<FormField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] =
    useState<FormField["type"]>("short_text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [fieldLabelError, setFieldLabelError] = useState(false);

  // Edit field state
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState("");
  const [editFieldType, setEditFieldType] =
    useState<FormField["type"]>("short_text");
  const [editFieldRequired, setEditFieldRequired] = useState(false);
  const [editFieldError, setEditFieldError] = useState("");

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedFormSlug, setSavedFormSlug] = useState("");
  // Show inline validation errors only after the user clicks Save Form once.
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // Copy-to-clipboard status: "" | "success" | "error"
  const [copyStatus, setCopyStatus] = useState<"" | "success" | "error">("");

  // Transient toast text shown when a field is added from the Field Library.
  const [lastAddedLabel, setLastAddedLabel] = useState("");

  // Currently selected field id -- powers the right Field Settings panel.
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // If the user edits anything after a successful save, allow saving again
  // by clearing the success state. The Save Form button stays disabled while
  // savedFormSlug is set, so this dirty-tracking re-enables it.
  useEffect(() => {
    if (savedFormSlug !== "") {
      setSavedFormSlug("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formTitle, formDescription, whatsappNumber, fields]);

  // --- Helpers (depend on current state) ---------------------------------

  function getCleanWhatsAppNumber(): string {
    // Strip everything except digits.
    return whatsappNumber.replace(/\D+/g, "");
  }

  function generateWhatsAppMessage(): string {
    const titleLine = `Form: ${formTitle.trim() || "Untitled Form"}`;
    const descriptionLine = formDescription.trim()
      ? `\nDescription: ${formDescription.trim()}`
      : "";

    const fieldsBlock =
      fields.length > 0
        ? fields.map((f) => `${f.label}: [Customer answer]`).join("\n")
        : `Name: [Customer answer]
Phone: [Customer answer]
Notes: [Customer answer]`;

    return `Hi, I'm interested.

${titleLine}${descriptionLine}

Customer Details:
${fieldsBlock}`;
  }

  function generateWhatsAppLink(): string {
    const cleanNumber = getCleanWhatsAppNumber();
    if (cleanNumber === "") return "";
    const encoded = encodeURIComponent(generateWhatsAppMessage());
    return `https://wa.me/${cleanNumber}?text=${encoded}`;
  }

  // Validation flags
  const titleMissing = formTitle.trim() === "";
  const numberMissing = whatsappNumber.trim() === "";
  const cleanNumber = getCleanWhatsAppNumber();
  const numberTooShort =
    !numberMissing && cleanNumber.length > 0 && cleanNumber.length < 8;

  // Computed previews
  const previewMessage = generateWhatsAppMessage();
  const whatsappLink = generateWhatsAppLink();

  async function handleCopyMessage() {
    try {
      await navigator.clipboard.writeText(previewMessage);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  function handleAddField() {
    if (newFieldLabel.trim() === "") {
      setFieldLabelError(true);
      return;
    }

    const newField: FormField = {
      id: generateFieldId(),
      label: newFieldLabel.trim(),
      type: newFieldType,
      required: newFieldRequired,
    };

    setFields((prev) => [...prev, newField]);
    // Auto-select the new field so the right panel jumps to it.
    setSelectedFieldId(newField.id);
    setNewFieldLabel("");
    setNewFieldType("short_text");
    setNewFieldRequired(false);
    setFieldLabelError(false);
  }

  // Patch a single field by id. Wired up to FieldSettingsPanel.
  function handleUpdateField(updated: FormField) {
    setFields((prev) =>
      prev.map((f) => (f.id === updated.id ? updated : f)),
    );
  }

  function handleStartEdit(field: FormField) {
    setEditingFieldId(field.id);
    setEditFieldLabel(field.label);
    setEditFieldType(field.type);
    setEditFieldRequired(field.required);
    setEditFieldError("");
  }

  function clearEditState() {
    setEditingFieldId(null);
    setEditFieldLabel("");
    setEditFieldType("short_text");
    setEditFieldRequired(false);
    setEditFieldError("");
  }

  function handleSaveEdit() {
    if (editingFieldId === null) return;

    if (editFieldLabel.trim() === "") {
      setEditFieldError("Field label is required.");
      return;
    }

    setFields((prev) =>
      prev.map((field) =>
        field.id === editingFieldId
          ? {
              ...field,
              label: editFieldLabel.trim(),
              type: editFieldType,
              required: editFieldRequired,
            }
          : field,
      ),
    );

    clearEditState();
  }

  function handleCancelEdit() {
    clearEditState();
  }

  function handleDeleteField(fieldId: string) {
    const confirmed = window.confirm("Delete this field?");
    if (!confirmed) return;
    setFields((prev) => prev.filter((field) => field.id !== fieldId));
    // If the deleted field was being edited, also clear the edit state.
    if (editingFieldId === fieldId) {
      clearEditState();
    }
    // Clear selection if the deleted field was selected.
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  }

  // Default labels used when adding a field straight from the Field
  // Library. Keeps the flow one-click without forcing the user to type
  // a label up front.
  const DEFAULT_FIELD_LABELS: Record<FieldTypeOption, string> = {
    short_text: "Short Text",
    long_text: "Long Text",
    phone: "Phone Number",
    email: "Email Address",
    number: "Number",
    date: "Date",
    dropdown: "Dropdown",
  };

  // Add a brand-new field directly into the canvas in one click.
  function handleAddFieldFromLibrary(type: FieldTypeOption) {
    const label = DEFAULT_FIELD_LABELS[type];
    const newField: FormField = {
      id: generateFieldId(),
      label,
      type: type as FormField["type"],
      required: false,
      // Dropdown gets two starter options so the field is usable
      // immediately without forcing the owner to add them by hand.
      options: type === "dropdown" ? ["Option 1", "Option 2"] : [],
      image_url: "",
    };
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    setLastAddedLabel(label);
    window.setTimeout(() => {
      setLastAddedLabel((current) => (current === label ? "" : current));
    }, 2500);
    if (typeof document !== "undefined") {
      const el = document.getElementById("add-field-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  async function handleSave() {
    // Mark that the user has attempted to save so inline field-level
    // validation messages start showing from now on.
    setHasAttemptedSave(true);

    // Validation
    if (formTitle.trim() === "") {
      setSaveError("Please enter a form title.");
      return;
    }
    if (whatsappNumber.trim() === "") {
      setSaveError("Please enter a WhatsApp receiver number.");
      return;
    }
    if (fields.length === 0) {
      setSaveError("Please add at least one field.");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSavedFormSlug("");

    // 0. Resolve current authenticated user (required for ownership).
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Failed to resolve auth user", userError);
      setSaveError("Your session has expired. Please log in again.");
      setIsSaving(false);
      return;
    }

    const slug = generateSlug(formTitle);

    // Keep the local debug log for now.
    console.log({
      formTitle,
      formDescription,
      whatsappNumber,
      fields,
    });

    // 1. Insert form (claim ownership for current user)
    const { data: insertedForm, error: formError } = await supabase
      .from("forms")
      .insert({
        title: formTitle.trim(),
        slug,
        description: formDescription.trim() || null,
        whatsapp_number: whatsappNumber.trim(),
        is_active: true,
        user_id: user.id,
      })
      .select("id")
      .single();

    if (formError || !insertedForm) {
      console.error("Failed to insert form", formError);
      setSaveError(
        formError?.message
          ? `Failed to save form: ${formError.message}`
          : "Failed to save form. Please try again.",
      );
      setIsSaving(false);
      return;
    }

    const formId = insertedForm.id as string;

    // 2. Insert form_fields
    const fieldRows = fields.map((field, index) => ({
      form_id: formId,
      label: field.label,
      field_key: generateFieldKey(field.label, field.id),
      field_type: field.type,
      required: field.required,
      sort_order: index,
      options_json: field.options ?? [],
      image_url: field.image_url && field.image_url.trim() !== ""
        ? field.image_url.trim()
        : null,
    }));

    const { error: fieldsError } = await supabase
      .from("form_fields")
      .insert(fieldRows);

    if (fieldsError) {
      console.error("Failed to insert form_fields", fieldsError);
      setSaveError(
        `Form saved, but fields failed: ${fieldsError.message}. Please edit the form to retry.`,
      );
      setIsSaving(false);
      return;
    }

    // Success
    setSavedFormSlug(slug);
    setIsSaving(false);
  }

  return (
    <BuilderShell
      topbar={
        <BuilderTopbar
          subtitle="New Form"
          title={formTitle}
          isSaving={isSaving || savedFormSlug !== ""}
          saveLabel={savedFormSlug ? "Saved" : "Save Form"}
          onSave={() => handleSave()}
          previewSlug={savedFormSlug || undefined}
        />
      }
      leftPanel={
        <FieldLibraryPanel onSelectType={handleAddFieldFromLibrary} />
      }
      rightPanel={
        <FieldSettingsPanel
          selectedField={
            fields.find((f) => f.id === selectedFieldId) ?? null
          }
          onUpdateField={handleUpdateField}
          onClearSelection={() => setSelectedFieldId(null)}
        />
      }
      canvas={
        <div className="flex flex-col gap-6">
        {/* Form Details card */}
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-black">Form Details</h2>
          <p className="mt-1 text-sm text-gray-500">
            Basic info shown to customers and used in the WhatsApp message.
          </p>

          <div className="mt-6 flex flex-col gap-5">
            <div>
              <label htmlFor="form-title" className={labelClass}>
                Form title
              </label>
              <input
                id="form-title"
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Example: Yunnan Travel Inquiry"
                className={inputClass}
              />
              {hasAttemptedSave && titleMissing && (
                <p className={errorTextClass}>Form title is required.</p>
              )}
            </div>

            <div>
              <label htmlFor="form-description" className={labelClass}>
                Form description
              </label>
              <textarea
                id="form-description"
                rows={3}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Example: Collect customer details before continuing to WhatsApp."
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label htmlFor="whatsapp-number" className={labelClass}>
                WhatsApp receiver number
              </label>
              <input
                id="whatsapp-number"
                type="tel"
                inputMode="numeric"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="Example: 60123456789"
                className={inputClass}
              />
              {hasAttemptedSave && numberMissing ? (
                <p className={errorTextClass}>
                  WhatsApp receiver number is required.
                </p>
              ) : hasAttemptedSave && numberTooShort ? (
                <p className={errorTextClass}>
                  WhatsApp number looks too short.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-500">
                  Use international format without &ldquo;+&rdquo; or spaces.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Form Fields card */}
        <section className={cardClass}>
          <div>
            <h2 className="text-lg font-semibold text-black">Form Fields</h2>
            <p className="mt-1 text-sm text-gray-500">
              Questions your customer will answer in this form. Drag fields to
              reorder them.
            </p>
          </div>

          {/* Toast: confirms a field was just added from the Field Library. */}
          {lastAddedLabel && (
            <div
              role="status"
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1.5 text-xs font-medium text-brand-dark"
            >
              <span aria-hidden>✓</span>
              {lastAddedLabel} field added.
            </div>
          )}

          {/* Manual Add Field sub-form -- secondary path now that the
              Field Library on the left handles the primary one-click flow. */}
          <div
            id="add-field-section"
            className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <h3 className="text-sm font-semibold text-black">
              Manual Add Field
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Or add a field with a custom label and required setting.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="new-field-label" className={labelClass}>
                  Field label
                </label>
                <input
                  id="new-field-label"
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => {
                    setNewFieldLabel(e.target.value);
                    if (fieldLabelError && e.target.value.trim() !== "") {
                      setFieldLabelError(false);
                    }
                  }}
                  placeholder="Example: Full Name"
                  className={inputClass}
                />
                {fieldLabelError && (
                  <p className={errorTextClass}>Field label is required.</p>
                )}
              </div>

              <div>
                <label htmlFor="new-field-type" className={labelClass}>
                  Field type
                </label>
                <select
                  id="new-field-type"
                  value={newFieldType}
                  onChange={(e) =>
                    setNewFieldType(e.target.value as FormField["type"])
                  }
                  className={inputClass}
                >
                  {FIELD_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-black">
                  <input
                    type="checkbox"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                  />
                  Required
                </label>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleAddField}
                className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
              >
                + Add Field
              </button>
            </div>
          </div>

          {/* Field list */}
          <div className="mt-6">
            {fields.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
                No fields added yet. Add your first field above.
              </div>
            ) : (
              <SortableFieldList
                fields={fields}
                onReorder={setFields}
                renderField={(field, dragHandle) => {
                  const index = fields.findIndex((f) => f.id === field.id);
                  const isEditing = editingFieldId === field.id;

                  if (isEditing) {
                    return (
                      <div className="rounded-xl border border-brand/40 bg-brand/5 p-4 sm:p-5">
                        <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark">
                          Editing field {index + 1}
                        </p>

                        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <label
                              htmlFor={`edit-field-label-${field.id}`}
                              className={labelClass}
                            >
                              Field label
                            </label>
                            <input
                              id={`edit-field-label-${field.id}`}
                              type="text"
                              value={editFieldLabel}
                              onChange={(e) => {
                                setEditFieldLabel(e.target.value);
                                if (
                                  editFieldError &&
                                  e.target.value.trim() !== ""
                                ) {
                                  setEditFieldError("");
                                }
                              }}
                              placeholder="Example: Full Name"
                              className={inputClass}
                            />
                            {editFieldError && (
                              <p className={errorTextClass}>
                                {editFieldError}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor={`edit-field-type-${field.id}`}
                              className={labelClass}
                            >
                              Field type
                            </label>
                            <select
                              id={`edit-field-type-${field.id}`}
                              value={editFieldType}
                              onChange={(e) =>
                                setEditFieldType(
                                  e.target.value as FormField["type"],
                                )
                              }
                              className={inputClass}
                            >
                              {FIELD_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-end">
                            <label className="inline-flex items-center gap-2 text-sm text-black">
                              <input
                                type="checkbox"
                                checked={editFieldRequired}
                                onChange={(e) =>
                                  setEditFieldRequired(e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                              />
                              Required
                            </label>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    );
                  }

                  const isSelected = selectedFieldId === field.id;
                  return (
                    <div
                      onClick={() => setSelectedFieldId(field.id)}
                      className={[
                        "flex cursor-pointer items-center gap-2 rounded-xl border p-4 transition-all sm:gap-3",
                        isSelected
                          ? "border-brand bg-brand/5 ring-2 ring-brand/30"
                          : "border-gray-200 bg-white hover:border-brand/30",
                      ].join(" ")}
                    >
                      {/* Drag handle */}
                      {dragHandle}
                      {/* Field info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-black">
                            {index + 1}. {field.label}
                          </p>
                          {isSelected && (
                            <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {getFieldTypeLabel(field.type)}
                        </p>
                      </div>

                      {/* Badge + actions */}
                      <div className="flex items-center justify-between gap-2 sm:justify-end">
                        <span
                          className={
                            field.required
                              ? "shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand-dark"
                              : "shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                          }
                        >
                          {field.required ? "Required" : "Optional"}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(field);
                          }}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
                          aria-label={`Edit field ${field.label}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteField(field.id);
                          }}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                          aria-label={`Delete field ${field.label}`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </div>
        </section>

        {/* WhatsApp Message Preview card */}
        <section className={cardClass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div>
              <h2 className="text-lg font-semibold text-black">
                WhatsApp Message Preview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                This is how the message will look when a customer submits the
                form.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyMessage}
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2"
            >
              Copy Message
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-black">
              {previewMessage}
            </pre>
          </div>

          {copyStatus === "success" && (
            <p className="mt-2 text-xs text-brand-dark">Message copied.</p>
          )}
          {copyStatus === "error" && (
            <p className="mt-2 text-xs text-red-600">
              Unable to copy message.
            </p>
          )}

          {/* WhatsApp Link Preview */}
          <div className="mt-6">
            <p className={labelClass}>WhatsApp Link Preview</p>
            {whatsappLink ? (
              <div className="mt-2 max-h-24 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3">
                <code className="block break-all font-mono text-xs text-black">
                  {whatsappLink}
                </code>
              </div>
            ) : (
              <p className="mt-2 text-xs text-gray-500">
                Add a WhatsApp receiver number to generate link preview.
              </p>
            )}
          </div>
        </section>

        {/* Save error banner */}
        {saveError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {saveError}
          </div>
        )}

        {/* Save success banner with public form link */}
        {savedFormSlug && (
          <div
            role="status"
            className="flex flex-col gap-3 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-dark sm:flex-row sm:items-center sm:justify-between"
          >
            <span>Form saved successfully.</span>
            <ButtonLink
              href={`/form/${savedFormSlug}`}
              variant="secondary"
              className="!py-1.5 !px-3 !text-xs"
            >
              View Public Form
            </ButtonLink>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ButtonLink href="/dashboard" variant="secondary">
            Cancel
          </ButtonLink>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving || savedFormSlug !== ""}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving
              ? "Saving..."
              : savedFormSlug
                ? "Saved"
                : "Save Form"}
          </button>
        </div>
        </div>
      }
    />
  );
}
