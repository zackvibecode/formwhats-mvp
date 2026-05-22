"use client";

/**
 * Live, read-only preview of the form being built. Mirrors the look of
 * `/form/[slug]` (public customer view) so the owner can see exactly
 * what their customer will see -- without having to save and open a
 * separate tab.
 *
 * The component is intentionally dumb: it takes the current builder
 * state via props and renders. No Supabase calls, no submission logic.
 * Inputs are disabled so the owner can't accidentally type into the
 * preview while editing.
 */

type PreviewFieldType =
  | "short_text"
  | "long_text"
  | "phone"
  | "email"
  | "number"
  | "date"
  | "dropdown";

export type PreviewField = {
  id: string;
  label: string;
  type: PreviewFieldType;
  required: boolean;
  options?: string[];
  image_url?: string;
};

type FormLivePreviewProps = {
  title: string;
  description: string;
  fields: PreviewField[];
};

const inputClass =
  "mt-2 block w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500 placeholder:text-gray-400";
const labelClass = "text-sm font-medium text-black";

export default function FormLivePreview({
  title,
  description,
  fields,
}: FormLivePreviewProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Live Preview
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            What your customer will see on the public form.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-dark">
          Updates as you edit
        </span>
      </header>

      {/* Card mimics the public form `/form/[slug]` layout so the owner
          gets a faithful preview without leaving the builder. */}
      <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <h1 className="text-xl font-bold tracking-tight text-black sm:text-2xl">
          {title.trim() === "" ? "Untitled Form" : title}
        </h1>
        {description.trim() !== "" && (
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        )}

        <div className="mt-6 flex flex-col gap-5">
          {fields.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-xs text-gray-500">
              No fields yet. Add a field from the left panel to see it here.
            </p>
          ) : (
            fields.map((field) => <PreviewFieldRow key={field.id} field={field} />)
          )}
        </div>

        {/* Disabled CTA -- preview only, no real submission */}
        <div className="mt-7">
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-brand/60 px-5 py-3 text-sm font-medium text-white opacity-80"
            title="Preview only"
          >
            Continue to WhatsApp
          </button>
        </div>
      </div>
    </section>
  );
}

// --- Field row ------------------------------------------------------------

function PreviewFieldRow({ field }: { field: PreviewField }) {
  const isImageOnly =
    !!field.image_url &&
    field.image_url.trim() !== "" &&
    (field.label.trim() === "" || field.label.trim() === "Image question");

  if (isImageOnly) {
    return (
      <div>
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={field.image_url ?? ""}
            alt=""
            className="block h-auto w-full"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div>
      {field.image_url && field.image_url.trim() !== "" && (
        <div className="mb-2 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={field.image_url}
            alt={field.label}
            className="block h-auto w-full"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}
      <label className={labelClass}>
        {field.label.trim() === "" ? "Untitled field" : field.label}
        {field.required && (
          <span className="ml-1 text-red-600" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <PreviewInput field={field} />
    </div>
  );
}

function PreviewInput({ field }: { field: PreviewField }) {
  switch (field.type) {
    case "long_text":
      return (
        <textarea
          rows={3}
          disabled
          placeholder="Customer answer"
          className={`${inputClass} resize-none`}
        />
      );
    case "phone":
      return (
        <input
          type="tel"
          disabled
          placeholder="Customer answer"
          className={inputClass}
        />
      );
    case "email":
      return (
        <input
          type="email"
          disabled
          placeholder="Customer answer"
          className={inputClass}
        />
      );
    case "number":
      return (
        <input
          type="number"
          disabled
          placeholder="Customer answer"
          className={inputClass}
        />
      );
    case "date":
      return <input type="date" disabled className={inputClass} />;
    case "dropdown":
      return (
        <select disabled className={`${inputClass} bg-gray-50`}>
          <option>Select an option</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>
      );
    case "short_text":
    default:
      return (
        <input
          type="text"
          disabled
          placeholder="Customer answer"
          className={inputClass}
        />
      );
  }
}
