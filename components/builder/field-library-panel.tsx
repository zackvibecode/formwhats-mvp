"use client";

import {
  ChatIcon,
  FormIcon,
  InboxIcon,
  LayersIcon,
  PhoneIcon,
} from "@/components/landing/icons";

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
};

export default function FieldLibraryPanel({
  onSelectType,
}: FieldLibraryPanelProps) {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header>
        <h2 className="text-sm font-semibold tracking-tight text-black">
          Field Library
        </h2>
        <p className="mt-1 text-xs text-gray-500">Add fields to your form.</p>
      </header>

      <ul className="mt-4 flex flex-col gap-2">
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
