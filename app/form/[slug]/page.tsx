"use client";

import { useEffect, useState } from "react";
import PageContainer from "@/components/page-container";
import { supabase } from "@/lib/supabase";

// --- Types -----------------------------------------------------------------

type PublicForm = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  whatsapp_number: string;
  is_active: boolean;
};

type PublicFormField = {
  id: string;
  form_id: string;
  label: string;
  field_key: string;
  field_type:
    | "short_text"
    | "long_text"
    | "phone"
    | "email"
    | "number"
    | "date"
    | "dropdown";
  required: boolean;
  sort_order: number;
  options: string[];
  image_url: string | null;
};

// --- Reusable class strings -----------------------------------------------

const inputClass =
  "mt-2 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-black placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

const labelClass = "text-sm font-medium text-black";

const errorTextClass = "mt-1.5 text-xs text-red-600";

// --- Helpers (pure) -------------------------------------------------------

function getCleanWhatsAppNumber(raw: string): string {
  return raw.replace(/\D+/g, "");
}

function buildWhatsAppMessage(
  form: PublicForm,
  fields: PublicFormField[],
  answers: Record<string, string>,
): string {
  const detailLines = fields
    .map((field) => {
      const raw = (answers[field.id] ?? "").trim();
      return `${field.label}: ${raw === "" ? "-" : raw}`;
    })
    .join("\n");

  const detailsBlock = fields.length > 0 ? detailLines : "(no fields)";

  return `Hi, I'm interested.

Form: ${form.title}

Customer Details:
${detailsBlock}`;
}

function buildWhatsAppLink(
  form: PublicForm,
  message: string,
): string {
  const cleanNumber = getCleanWhatsAppNumber(form.whatsapp_number);
  if (cleanNumber === "") return "";
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

// Mobile-safe WhatsApp opener.
// Using same-tab navigation (window.location.href) is more reliable on mobile
// browsers than window.open(..., "_blank"), which can be blocked by popup
// blockers when triggered after an async operation (e.g. Supabase insert).
function openWhatsAppLink(link: string) {
  if (typeof window === "undefined") return;
  window.location.href = link;
}


// --- Page ------------------------------------------------------------------

type PublicFormPageProps = {
  params: { slug: string };
};

export default function PublicFormPage({ params }: PublicFormPageProps) {
  const slug = params?.slug ?? "";

  // Form data state
  const [form, setForm] = useState<PublicForm | null>(null);
  const [fields, setFields] = useState<PublicFormField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Customer input state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitStatus, setSubmitStatus] = useState<
    "" | "saving" | "opening" | "no_number" | "error"
  >("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pendingWhatsAppLink, setPendingWhatsAppLink] = useState("");


  // Fetch form by slug, then its fields
  useEffect(() => {
    let cancelled = false;

    async function loadFormAndFields() {
      setIsLoading(true);
      setLoadError("");
      setForm(null);
      setFields([]);

      const { data: formData, error: formError } = await supabase
        .from("forms")
        .select("id, title, slug, description, whatsapp_number, is_active")
        .eq("slug", slug)
        .maybeSingle();

      if (cancelled) return;

      if (formError) {
        console.error("Failed to load form", formError);
        setLoadError("Failed to load form.");
        setIsLoading(false);
        return;
      }

      if (!formData) {
        // Not found -> keep form null, stop loading
        setIsLoading(false);
        return;
      }

      const loadedForm = formData as PublicForm;
      setForm(loadedForm);

      // If inactive, no need to fetch fields for the public form.
      if (!loadedForm.is_active) {
        setIsLoading(false);
        return;
      }

      const { data: fieldsData, error: fieldsError } = await supabase
        .from("form_fields")
        .select(
          "id, form_id, label, field_key, field_type, required, sort_order, options_json, image_url",
        )
        .eq("form_id", loadedForm.id)
        .order("sort_order", { ascending: true });

      if (cancelled) return;

      if (fieldsError) {
        console.error("Failed to load form_fields", fieldsError);
        setLoadError("Failed to load form.");
        setIsLoading(false);
        return;
      }

      // Normalize options_json -> string[] and image_url -> string | null.
      const normalized: PublicFormField[] = (fieldsData ?? []).map((r) => {
        const rawOptions = (r as { options_json?: unknown }).options_json;
        const options = Array.isArray(rawOptions)
          ? (rawOptions as unknown[]).map((o) => String(o))
          : [];
        const rawImageUrl = (r as { image_url?: unknown }).image_url;
        return {
          id: r.id as string,
          form_id: r.form_id as string,
          label: r.label as string,
          field_key: r.field_key as string,
          field_type: r.field_type as PublicFormField["field_type"],
          required: !!r.required,
          sort_order: (r.sort_order as number) ?? 0,
          options,
          image_url: typeof rawImageUrl === "string" ? rawImageUrl : null,
        };
      });
      setFields(normalized);
      setIsLoading(false);
    }

    loadFormAndFields();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Computed previews when form is ready
  const previewMessage = form ? buildWhatsAppMessage(form, fields, answers) : "";
  const previewLink = form ? buildWhatsAppLink(form, previewMessage) : "";

  function handleAnswerChange(fieldId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }

  async function handleContinue() {
    if (!form || isSubmitting) return;

    // 1. Validate required fields
    const nextErrors: Record<string, string> = {};
    fields.forEach((field) => {
      if (field.required) {
        const value = (answers[field.id] ?? "").trim();
        if (value === "") {
          nextErrors[field.id] = "This field is required.";
        }
      }
    });

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setSubmitStatus("");
      return;
    }

    // 2. Build message + link
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitStatus("saving");
    setPendingWhatsAppLink("");

    const whatsappMessage = buildWhatsAppMessage(form, fields, answers);
    const whatsappLink = buildWhatsAppLink(form, whatsappMessage);

    if (whatsappLink === "") {
      setSubmitStatus("no_number");
      setIsSubmitting(false);
      return;
    }

    // 3. Save response to Supabase.
    // IMPORTANT: do NOT chain `.select(...).single()` here. Public/anonymous
    // visitors of the form do not have RLS SELECT permission on `responses`
    // (only the form owner does). If we try to read back the inserted row,
    // the response is filtered out by RLS and the call appears to "fail"
    // even though the insert itself succeeded. Insert-only is enough.
    const { error: insertError } = await supabase
      .from("responses")
      .insert({
        form_id: form.id,
        data_json: answers,
        whatsapp_message: whatsappMessage,
      });

    if (insertError) {
      console.error("Failed to save response", insertError);
      setSubmitError("Failed to save response. Please try again.");
      setSubmitStatus("error");
      setIsSubmitting(false);
      return;
    }

    // 4. Success: open WhatsApp via same-tab navigation.
    // Same-tab redirect (window.location.href) is reliable on mobile and
    // does not get blocked by popup blockers like window.open(_, "_blank").
    // No PII is logged in production -- customer answers stay out of the
    // browser console.
    if (process.env.NODE_ENV !== "production") {
      console.log("[FormWhats] submit ok", {
        formSlug: form.slug,
        formId: form.id,
      });
    }



    setPendingWhatsAppLink(whatsappLink);
    setSubmitStatus("opening");
    openWhatsAppLink(whatsappLink);
    // Note: keep isSubmitting=true while opening, since the page is about to
    // navigate away. If the redirect is blocked (rare), the manual fallback
    // link is rendered for the user to tap.
  }


  function renderFieldInput(field: PublicFormField) {
    const value = answers[field.id] ?? "";
    const commonProps = {
      id: `field-${field.id}`,
      value,
      onChange: (
        e: React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
      ) => handleAnswerChange(field.id, e.target.value),
      className: inputClass,
    };

    switch (field.field_type) {
      case "long_text":
        return <textarea {...commonProps} rows={3} />;
      case "phone":
        return <input {...commonProps} type="tel" inputMode="tel" />;
      case "email":
        return <input {...commonProps} type="email" inputMode="email" />;
      case "number":
        return <input {...commonProps} type="number" inputMode="numeric" />;
      case "date":
        return <input {...commonProps} type="date" />;
      case "dropdown":
        return (
          <select {...commonProps} className={`${inputClass} bg-white`}>
            <option value="">Select an option</option>
            {field.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );
      case "short_text":
      default:
        return <input {...commonProps} type="text" />;
    }
  }

  // --- Render branches ----------------------------------------------------

  if (isLoading) {
    return (
      <PageContainer>
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
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
          className="mx-auto w-full max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-600"
        >
          {loadError}
        </div>
      </PageContainer>
    );
  }

  if (!form) {
    return (
      <PageContainer>
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-black">Form not found.</h1>
          <p className="mt-2 text-sm text-gray-500">
            The form slug{" "}
            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-black">
              {slug}
            </span>{" "}
            does not exist.
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!form.is_active) {
    return (
      <PageContainer>
        <div className="mx-auto w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-black">
            This form is not active.
          </h1>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Form header */}
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-black sm:text-3xl">
              {form.title}
            </h1>
            {form.description && (
              <p className="mt-2 text-sm text-gray-600">{form.description}</p>
            )}
          </header>

          {/* Fields */}
          <div className="mt-8 flex flex-col gap-5">
            {fields.length === 0 ? (
              <p className="text-sm text-gray-500">
                This form has no fields yet.
              </p>
            ) : (
              fields.map((field) => {
                const error = errors[field.id];
                return (
                  <div key={field.id}>
                    {field.image_url && (
                      <div className="mb-2 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={field.image_url}
                          alt={field.label}
                          className="block max-h-[220px] w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                    <label
                      htmlFor={`field-${field.id}`}
                      className={labelClass}
                    >
                      {field.label}
                      {field.required && (
                        <span
                          className="ml-1 text-red-600"
                          aria-hidden="true"
                        >
                          *
                        </span>
                      )}
                    </label>
                    {renderFieldInput(field)}
                    {error && <p className={errorTextClass}>{error}</p>}
                  </div>
                );
              })
            )}
          </div>

          {/* WhatsApp Message Preview */}
          <div className="mt-8">
            <p className={labelClass}>WhatsApp Message Preview</p>
            <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-black">
                {previewMessage}
              </pre>
            </div>
            {previewLink === "" && (
              <p className="mt-2 text-xs text-gray-500">
                WhatsApp receiver number is not set on this form.
              </p>
            )}
          </div>

          {/* Status banners */}
          {submitStatus === "opening" && (
            <div
              role="status"
              className="mt-6 rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm text-brand-dark"
            >
              <p>Opening WhatsApp...</p>
              {pendingWhatsAppLink !== "" && (
                <p className="mt-1 text-xs text-brand-dark/80">
                  If WhatsApp does not open,{" "}
                  <a
                    href={pendingWhatsAppLink}
                    className="font-medium underline underline-offset-2"
                  >
                    tap here to open WhatsApp manually
                  </a>
                  .
                </p>
              )}
            </div>
          )}
          {submitStatus === "no_number" && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              WhatsApp receiver number is not set.
            </div>
          )}
          {submitError && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {submitError}
            </div>
          )}

          {/* Continue button */}
          <div className="mt-8">
            <button
              type="button"
              onClick={handleContinue}
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitStatus === "opening"
                ? "Opening WhatsApp..."
                : submitStatus === "saving" || isSubmitting
                  ? "Saving response..."
                  : "Continue to WhatsApp"}
            </button>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
