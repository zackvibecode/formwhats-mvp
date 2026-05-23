"use client";

import { useRef, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { uploadFieldImage } from "@/lib/upload-field-image";

export type FieldTypeOption =
  | "short_text"
  | "long_text"
  | "phone"
  | "email"
  | "number"
  | "date"
  | "dropdown";

const items: {
  value: FieldTypeOption;
  label: string;
  desc: string;
  icon: ReactNode;
}[] = [
  {
    value: "short_text",
    label: "Short Text",
    desc: "One-line answer",
    icon: <ShortTextIcon />,
  },
  {
    value: "long_text",
    label: "Long Text",
    desc: "Multi-line answer",
    icon: <LongTextIcon />,
  },
  {
    value: "phone",
    label: "Phone",
    desc: "Phone number input",
    icon: <PhoneFieldIcon />,
  },
  {
    value: "email",
    label: "Email",
    desc: "Email address input",
    icon: <EmailIcon />,
  },
  {
    value: "number",
    label: "Number",
    desc: "Numeric value",
    icon: <NumberIcon />,
  },
  {
    value: "date",
    label: "Date",
    desc: "Calendar picker",
    icon: <DateIcon />,
  },
  {
    value: "dropdown",
    label: "Dropdown",
    desc: "Choose one option",
    icon: <DropdownIcon />,
  },
];

type FieldLibraryPanelProps = {
  /**
   * Optional callback when the user clicks a field type. Pages may use it
   * to pre-fill their existing "Add Field" subform with the selected type
   * and scroll to it. Optional -- if not provided, clicks are a no-op.
   */
  onSelectType?: (type: FieldTypeOption) => void;
  /**
   * Optional callback when the user uploads an image from the library.
   * The handler should create a new field on the canvas and pre-fill its
   * `image_url` with the returned public URL (and auto-select it so the
   * user can immediately edit the field label).
   */
  onUploadImage?: (publicUrl: string) => void;
};

export default function FieldLibraryPanel({
  onSelectType,
  onUploadImage,
}: FieldLibraryPanelProps) {
  // --- Image upload state -------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  // True while a file is being dragged over the Image dropzone. We use
  // a ref-counter under the hood (see handlers) so nested drag-enter
  // events on inner children don't toggle the highlight off prematurely.
  const [isDragOver, setIsDragOver] = useState(false);
  const dragDepthRef = useRef(0);

  /**
   * Shared upload pipeline used by BOTH the click-to-pick and drag-and-drop
   * code paths. Keeps validation + auth + Supabase upload in one place.
   */
  async function processFile(file: File) {
    setUploadError("");
    setIsUploading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setUploadError("Please login again to upload images.");
        return;
      }

      const publicUrl = await uploadFieldImage(file, user.id);
      onUploadImage?.(publicUrl);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload image.";
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  }

  function handleImageClick() {
    if (isUploading) return;
    setUploadError("");
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset so the same file can be picked again after a failed upload.
    e.target.value = "";
    if (!file) return;
    await processFile(file);
  }

  // --- Drag-and-drop handlers --------------------------------------------

  function handleDragEnter(e: React.DragEvent<HTMLLIElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    dragDepthRef.current += 1;
    setIsDragOver(true);
  }

  function handleDragOver(e: React.DragEvent<HTMLLIElement>) {
    // Required to allow drop events to fire in the browser.
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    e.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(e: React.DragEvent<HTMLLIElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDragOver(false);
  }

  async function handleDrop(e: React.DragEvent<HTMLLIElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragOver(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  }


  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-black">
          Add Questions
        </h2>
        {/* Basic / Advanced tab pair. Advanced is reserved for future
            features (rating, signature, file uploads, etc.) -- we render
            it as a disabled tab so the UI hints at what's coming without
            implying the feature already exists. */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1 text-xs">
          <button
            type="button"
            aria-current="page"
            className="rounded-md bg-white px-3 py-1.5 font-medium text-brand-dark shadow-sm"
          >
            Basic
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded-md px-3 py-1.5 font-medium text-gray-400"
          >
            Advanced
          </button>
        </div>
      </header>


      {/* Hidden file input -- driven by the Image button below. */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <ul className="mt-4 flex flex-col gap-2">
        {/* Image upload item -- behaves like a one-click field type but
            opens a file picker first, then injects a new field on success.
            Wrapping <li> doubles as a drag-and-drop dropzone so the user
            can drag a picture from their desktop straight onto the panel. */}
        <li
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <button
            type="button"
            onClick={handleImageClick}
            disabled={isUploading}
            className={[
              "group flex w-full cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-60",
              isDragOver
                ? "border-brand bg-brand/15 ring-2 ring-brand/30"
                : "border-brand/30 bg-brand/5 hover:border-brand/60 hover:bg-brand/10",
            ].join(" ")}
          >
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-base transition-colors group-hover:bg-brand/20"
            >
              📷
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-black">
                {isUploading
                  ? "Uploading..."
                  : isDragOver
                    ? "Drop image here"
                    : "Image"}
              </span>
              <span className="block truncate text-[11px] text-gray-500">
                {isDragOver
                  ? "Release to upload"
                  : "Click or drag picture here"}
              </span>
            </span>
            <span
              aria-hidden
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white"
            >
              +
            </span>
          </button>
        </li>


        {uploadError && (
          <li
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-[11px] text-red-600"
          >
            {uploadError}
          </li>
        )}

        {items.map((item) => (
          <li key={item.value}>
            <button
              type="button"
              onClick={() => onSelectType?.(item.value)}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/5 hover:shadow-sm active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition-colors group-hover:bg-brand/10 group-hover:text-brand-dark"
              >
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-black">
                  {item.label}
                </span>
                <span className="block truncate text-[11px] text-gray-500">
                  {item.desc}
                </span>
              </span>
              <span
                aria-hidden
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500 transition-colors group-hover:bg-brand group-hover:text-white"
              >
                +
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Tip footer */}
      <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-3 text-[11px] leading-relaxed text-gray-500">
        Click any field type to add it to your form. Drag the grip handle on
        a field card in the canvas to reorder.
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Inline icons (replaces emoji per UI/UX skill rules)
// ---------------------------------------------------------------------------

const fieldIconClass = "h-4 w-4";

function svgWrap(children: ReactNode) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={fieldIconClass}
      aria-hidden
    >
      {children}
    </svg>
  );
}

function ShortTextIcon() {
  return svgWrap(
    <>
      <path d="M3 7h18" />
      <path d="M3 12h12" />
    </>,
  );
}

function LongTextIcon() {
  return svgWrap(
    <>
      <path d="M3 6h18" />
      <path d="M3 11h18" />
      <path d="M3 16h12" />
    </>,
  );
}

function PhoneFieldIcon() {
  return svgWrap(
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  );
}

function EmailIcon() {
  return svgWrap(
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </>,
  );
}

function NumberIcon() {
  return svgWrap(
    <>
      <path d="M4 9h16" />
      <path d="M4 15h16" />
      <path d="M10 3 8 21" />
      <path d="M16 3l-2 18" />
    </>,
  );
}

function DateIcon() {
  return svgWrap(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </>,
  );
}

function DropdownIcon() {
  return svgWrap(
    <>
      <path d="M6 9l6 6 6-6" />
    </>,
  );
}
