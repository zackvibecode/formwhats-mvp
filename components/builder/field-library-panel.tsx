"use client";

import { useRef, useState } from "react";
import {
  ChatIcon,
  FormIcon,
  InboxIcon,
  LayersIcon,
  PhoneIcon,
} from "@/components/landing/icons";
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
  emoji: string;
}[] = [
  { value: "short_text", label: "Short Text", desc: "One-line answer", emoji: "✍️" },
  { value: "long_text", label: "Long Text", desc: "Multi-line answer", emoji: "📝" },
  { value: "phone", label: "Phone", desc: "Phone number input", emoji: "📞" },
  { value: "email", label: "Email", desc: "Email address input", emoji: "✉️" },
  { value: "number", label: "Number", desc: "Numeric value", emoji: "🔢" },
  { value: "date", label: "Date", desc: "Calendar picker", emoji: "📅" },
  { value: "dropdown", label: "Dropdown", desc: "Choose one option", emoji: "▾" },
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
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-base transition-colors group-hover:bg-brand/10"
              >
                {item.emoji}
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

      {/* Subtle stat row to make the panel feel substantive */}
      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 text-[11px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <LayersIcon className="h-3.5 w-3.5 text-brand-dark" />7 field types
        </div>
        <div className="flex items-center gap-1.5">
          <ChatIcon className="h-3.5 w-3.5 text-brand-dark" />
          WhatsApp ready
        </div>
        <div className="flex items-center gap-1.5">
          <FormIcon className="h-3.5 w-3.5 text-brand-dark" />
          Mobile friendly
        </div>
        <div className="flex items-center gap-1.5">
          <InboxIcon className="h-3.5 w-3.5 text-brand-dark" />
          Saves automatically
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <PhoneIcon className="h-3.5 w-3.5 text-brand-dark" />
          Built for WhatsApp leads
        </div>
      </div>
    </aside>
  );
}
