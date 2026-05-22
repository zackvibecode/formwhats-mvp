"use client";

import { useEffect, useRef, useState } from "react";

import ButtonLink from "@/components/button-link";
import BuilderShell from "@/components/builder/builder-shell";
import BuilderTopbar from "@/components/builder/builder-topbar";
import FieldLibraryPanel, {
  type FieldTypeOption,
} from "@/components/builder/field-library-panel";
import FieldSettingsPanel from "@/components/builder/field-settings-panel";
import SortableFieldList from "@/components/builder/sortable-field-list";
import PageContainer from "@/components/page-container";
import { supabase } from "@/lib/supabase";

// --- Types -----------------------------------------------------------------

type FieldType =
  | "short_text"
  | "long_text"
  | "phone"
  | "email"
  | "number"
  | "date"
  | "dropdown";

type FormField = {
  id: string; // local UI id (not the row id once saved)
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[];
  image_url?: string;
};

type LoadedForm = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  whatsapp_number: string;
  is_active: boolean;
};

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "dropdown", label: "Dropdown" },
];

const inputClass =
  "mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";
const labelClass = "text-sm font-medium text-black";
const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8";
const errorTextClass = "mt-1.5 text-xs text-red-600";

function generateFieldId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Date.now().toString();
}

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

// --- Page ------------------------------------------------------------------

type EditFormPageProps = { params: { id: string } };

export default function EditFormPage({ params }: EditFormPageProps) {
  const formId = params?.id ?? "";

  // Load state
  const [loadedForm, setLoadedForm] = useState<LoadedForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Editable form details
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Editable fields
  const [fields, setFields] = useState<FormField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("short_text");
  const [newFieldRequired, setNewFieldRequired] = useState(false);
  const [fieldLabelError, setFieldLabelError] = useState(false);

  // Inline-edit state (for the existing-fields list)
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldLabel, setEditFieldLabel] = useState("");
  const [editFieldType, setEditFieldType] = useState<FieldType>("short_text");
  const [editFieldRequired, setEditFieldRequired] = useState(false);
  const [editFieldError, setEditFieldError] = useState("");

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasAttemptedSave, setHasAttemptedSave] = useState(false);

  // Transient toast text shown when a field is added from the Field Library.
  const [lastAddedLabel, setLastAddedLabel] = useState("");

  // Currently selected field id -- powers the right Field Settings panel.
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  // Snapshot of field row UUIDs that existed in the DB at load time.
  // We use this on save to figure out which rows to UPDATE (already in DB),
  // which to INSERT (added by the user since loading), and which to DELETE
  // (removed by the user since loading). Preserving UUIDs of existing rows
  // means older responses (whose data_json is keyed by field UUID) keep
  // mapping to the right field labels.
  const initialFieldIdsRef = useRef<string[]>([]);


  // Clear success banner the moment user changes anything.
  useEffect(() => {
    if (saveSuccess) setSaveSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formTitle, formDescription, whatsappNumber, isActive, fields]);

  // --- Initial load: form + fields scoped to current user -----------------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setLoadError("");
      setLoadedForm(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (userErr || !user) {
        setLoadError("Failed to load form.");
        setIsLoading(false);
        return;
      }

      const { data: formRow, error: formErr } = await supabase
        .from("forms")
        .select("id, title, slug, description, whatsapp_number, is_active")
        .eq("id", formId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (formErr) {
        setLoadError("Failed to load form.");
        setIsLoading(false);
        return;
      }
      if (!formRow) {
        setIsLoading(false);
        return;
      }

      const f = formRow as LoadedForm;
      setLoadedForm(f);
      setFormTitle(f.title);
      setFormDescription(f.description ?? "");
      setWhatsappNumber(f.whatsapp_number);
      setIsActive(f.is_active);

      const { data: fieldRows, error: fieldsErr } = await supabase
        .from("form_fields")
        .select(
          "id, label, field_type, required, sort_order, options_json, image_url",
        )
        .eq("form_id", f.id)
        .order("sort_order", { ascending: true });
      if (cancelled) return;
      if (fieldsErr) {
        setLoadError("Failed to load form fields.");
        setIsLoading(false);
        return;
      }

      const normalizedRows = (fieldRows ?? []).map((r) => {
        const rawOptions = (r as { options_json?: unknown }).options_json;
        const options = Array.isArray(rawOptions)
          ? (rawOptions as unknown[]).map((o) => String(o))
          : [];
        const rawImageUrl = (r as { image_url?: unknown }).image_url;
        return {
          id: r.id as string,
          label: r.label as string,
          type: r.field_type as FieldType,
          required: !!r.required,
          options,
          image_url: typeof rawImageUrl === "string" ? rawImageUrl : "",
        };
      });

      setFields(normalizedRows);
      // Snapshot DB-known field UUIDs for later diff in handleSave().
      initialFieldIdsRef.current = normalizedRows.map((r) => r.id);

      setIsLoading(false);

    }

    load();
    return () => {
      cancelled = true;
    };
  }, [formId]);

  // --- Field manipulation handlers ----------------------------------------

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
      prev.map((f) =>
        f.id === editingFieldId
          ? {
              ...f,
              label: editFieldLabel.trim(),
              type: editFieldType,
              required: editFieldRequired,
            }
          : f,
      ),
    );
    clearEditState();
  }

  function handleDeleteField(id: string) {
    if (!window.confirm("Delete this field?")) return;
    setFields((prev) => prev.filter((f) => f.id !== id));
    if (editingFieldId === id) clearEditState();
    if (selectedFieldId === id) setSelectedFieldId(null);
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
      type: type as FieldType,
      required: false,
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

  // Library "Image" button: create a brand-new field that already has the
  // uploaded image attached. Default to short_text so the customer has a
  // working input under the picture; user can change type/label later from
  // the right Field Settings panel.
  // Image-only field: empty label + short_text type. The public form
  // renders the picture alone (no label, no input) for any field whose
  // label is blank but has an image_url.
  function handleAddImageFieldFromLibrary(publicUrl: string) {
    const newField: FormField = {
      id: generateFieldId(),
      label: "",
      type: "short_text",
      required: false,
      options: [],
      image_url: publicUrl,
    };

    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    setLastAddedLabel("Image");
    window.setTimeout(() => {
      setLastAddedLabel((current) => (current === "Image" ? "" : current));
    }, 2500);
  }


  // --- Save: update form + replace form_fields ----------------------------

  async function handleSave() {
    setHasAttemptedSave(true);
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
    if (!loadedForm) return;

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    const { error: updateErr } = await supabase
      .from("forms")
      .update({
        title: formTitle.trim(),
        description: formDescription.trim() || null,
        whatsapp_number: whatsappNumber.trim(),
        is_active: isActive,
      })
      .eq("id", loadedForm.id);

    if (updateErr) {
      console.error("Failed to update form", updateErr);
      setSaveError("Failed to update form. Please try again.");
      setIsSaving(false);
      return;
    }

    // Diff against the snapshot taken at load time so we PRESERVE existing
    // field row UUIDs. Customer responses store answers keyed by field UUID,
    // so reusing UUIDs means old responses still map to the right labels
    // after an edit (instead of showing "-" everywhere).
    const initialIds = new Set(initialFieldIdsRef.current);
    const currentIds = new Set(fields.map((f) => f.id));

    const idsToDelete = [...initialIds].filter((id) => !currentIds.has(id));
    const fieldsToUpdate = fields.filter((f) => initialIds.has(f.id));
    const fieldsToInsert = fields.filter((f) => !initialIds.has(f.id));

    // 1. Delete any field rows the user removed from the canvas.
    if (idsToDelete.length > 0) {
      const { error: delErr } = await supabase
        .from("form_fields")
        .delete()
        .in("id", idsToDelete);
      if (delErr) {
        console.error("Failed to delete removed fields", delErr);
        setSaveError("Failed to update form. Please try again.");
        setIsSaving(false);
        return;
      }
    }

    // 2. Update existing field rows in place. We do one UPDATE per row to
    //    keep the SQL straightforward; volumes here are small (form has
    //    typically <20 fields) so the round-trips are negligible.
    for (const field of fieldsToUpdate) {
      const sortOrder = fields.findIndex((f) => f.id === field.id);
      const { error: updErr } = await supabase
        .from("form_fields")
        .update({
          label: field.label,
          field_key: generateFieldKey(field.label, field.id),
          field_type: field.type,
          required: field.required,
          sort_order: sortOrder,
          options_json: field.options ?? [],
          image_url:
            field.image_url && field.image_url.trim() !== ""
              ? field.image_url.trim()
              : null,
        })
        .eq("id", field.id)
        .eq("form_id", loadedForm.id);
      if (updErr) {
        console.error("Failed to update field", updErr);
        setSaveError("Failed to update form. Please try again.");
        setIsSaving(false);
        return;
      }
    }

    // 3. Insert any brand-new fields the user added since loading.
    if (fieldsToInsert.length > 0) {
      const insertRows = fieldsToInsert.map((field) => {
        const sortOrder = fields.findIndex((f) => f.id === field.id);
        return {
          // Provide our locally-generated UUID so we control the id and can
          // keep the React UI in sync without re-fetching after save.
          id: field.id,
          form_id: loadedForm.id,
          label: field.label,
          field_key: generateFieldKey(field.label, field.id),
          field_type: field.type,
          required: field.required,
          sort_order: sortOrder,
          options_json: field.options ?? [],
          image_url:
            field.image_url && field.image_url.trim() !== ""
              ? field.image_url.trim()
              : null,
        };
      });
      const { error: insErr } = await supabase
        .from("form_fields")
        .insert(insertRows);
      if (insErr) {
        console.error("Failed to insert new fields", insErr);
        setSaveError("Failed to update form. Please try again.");
        setIsSaving(false);
        return;
      }
    }

    // Update the snapshot so a subsequent save in the same session diffs
    // against the now-current set of field row UUIDs.
    initialFieldIdsRef.current = fields.map((f) => f.id);

    setSaveSuccess(true);
    setIsSaving(false);
  }


  // --- Render branches ----------------------------------------------------

  if (isLoading) {
    return (
      <PageContainer>
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500 shadow-sm">
          Loading form...
        </div>
      </PageContainer>
    );
  }
  if (loadError) {
    return (
      <PageContainer>
        <div
          role="alert"
          className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-600"
        >
          {loadError}
        </div>
      </PageContainer>
    );
  }
  if (!loadedForm) {
    return (
      <PageContainer>
        <div className="rounded-3xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-black">Form not found.</h1>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/dashboard" variant="secondary">
              Back to Dashboard
            </ButtonLink>
          </div>
        </div>
      </PageContainer>
    );
  }

  const titleMissing = formTitle.trim() === "";
  const numberMissing = whatsappNumber.trim() === "";

  return (
    <BuilderShell
      topbar={
        <BuilderTopbar
          subtitle="Edit Form"
          title={formTitle}
          isSaving={isSaving}
          saveLabel="Save Changes"
          onSave={() => handleSave()}
          previewSlug={loadedForm.slug}
          formId={loadedForm.id}
        />

      }
      leftPanel={
        <FieldLibraryPanel
          onSelectType={handleAddFieldFromLibrary}
          onUploadImage={handleAddImageFieldFromLibrary}
        />
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
        {/* Form Details */}
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-black">Form Details</h2>
          <p className="mt-1 text-sm text-gray-500">
            Slug{" "}
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              {loadedForm.slug}
            </span>{" "}
            stays the same to protect existing public links.
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
                className={inputClass}
              />
              {hasAttemptedSave && numberMissing && (
                <p className={errorTextClass}>
                  WhatsApp receiver number is required.
                </p>
              )}
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-black">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
              />
              Form is active (customers can submit responses)
            </label>
          </div>
        </section>

        {/* Form Fields */}
        <section className={cardClass}>
          <h2 className="text-lg font-semibold text-black">Form Fields</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the questions your customers will answer. Drag fields to
            reorder them.
          </p>

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
                    setNewFieldType(e.target.value as FieldType)
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
                This form has no fields. Add one above to keep it usable.
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
                            <label className={labelClass}>Field label</label>
                            <input
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
                              className={inputClass}
                            />
                            {editFieldError && (
                              <p className={errorTextClass}>{editFieldError}</p>
                            )}
                          </div>
                          <div>
                            <label className={labelClass}>Field type</label>
                            <select
                              value={editFieldType}
                              onChange={(e) =>
                                setEditFieldType(e.target.value as FieldType)
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
                            onClick={clearEditState}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveEdit}
                            className="inline-flex items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark"
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
                      {dragHandle}
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
                          {FIELD_TYPE_OPTIONS.find(
                            (o) => o.value === field.type,
                          )?.label ?? "Short Text"}
                        </p>
                      </div>
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
                          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-black transition hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteField(field.id);
                          }}
                          className="inline-flex shrink-0 items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
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

        {/* Banners */}
        {saveError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div
            role="status"
            className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-dark"
          >
            Form updated successfully.
          </div>
        )}

        {/* Action row */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <ButtonLink href="/dashboard" variant="secondary">
            Back to Dashboard
          </ButtonLink>
          <ButtonLink
            href={`/form/${loadedForm.slug}`}
            variant="secondary"
            className="!py-2 !px-4 !text-sm"
          >
            View Public Form
          </ButtonLink>
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
        </div>
      }
    />
  );
}
