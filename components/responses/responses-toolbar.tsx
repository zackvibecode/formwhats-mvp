"use client";

/**
 * Toolbar that sits above the responses spreadsheet.
 *
 * Left cluster:  Export as Excel | Export as CSV | Delete | Reload
 * Right cluster: Search input    | From date     | To date
 *
 * The component is intentionally "dumb" — it just emits user intent
 * back up to the page through callback props. State for filters,
 * selection and loading lives in the page so the table and toolbar
 * stay in sync.
 */

type ResponsesToolbarProps = {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;

  // Date filter
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;

  // Selection-aware actions
  selectedCount: number;
  onDeleteSelected: () => void;

  // Exports
  onExportCsv: () => void;
  onExportXlsx: () => void;

  // Reload
  onReload: () => void;
  isReloading?: boolean;

  // Disable state while delete/reload is in flight
  isDeleting?: boolean;
};

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50";

const lightButton =
  `${buttonBase} border-gray-300 bg-white text-black hover:bg-gray-50 focus:ring-brand/40`;

const dangerButton =
  `${buttonBase} border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 focus:ring-red-300`;

const inputBase =
  "block rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30";

export default function ResponsesToolbar({
  searchQuery,
  onSearchChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  selectedCount,
  onDeleteSelected,
  onExportCsv,
  onExportXlsx,
  onReload,
  isReloading = false,
  isDeleting = false,
}: ResponsesToolbarProps) {
  const deleteDisabled = selectedCount === 0 || isDeleting;

  return (
    <div className="flex flex-col gap-3 sm:gap-2 lg:flex-row lg:items-center lg:justify-between">
      {/* Left cluster: actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onExportXlsx}
          className={lightButton}
          aria-label="Export responses as Excel"
        >
          <ExcelIcon />
          <span>Export as Excel</span>
        </button>

        <button
          type="button"
          onClick={onExportCsv}
          className={lightButton}
          aria-label="Export responses as CSV"
        >
          <CsvIcon />
          <span>Export as CSV</span>
        </button>

        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={deleteDisabled}
          className={dangerButton}
          aria-label="Delete selected responses"
        >
          <TrashIcon />
          <span>
            {isDeleting
              ? "Deleting..."
              : selectedCount > 0
                ? `Delete (${selectedCount})`
                : "Delete"}
          </span>
        </button>

        <button
          type="button"
          onClick={onReload}
          disabled={isReloading}
          className={lightButton}
          aria-label="Reload responses"
        >
          <ReloadIcon spinning={isReloading} />
          <span>{isReloading ? "Reloading..." : "Reload"}</span>
        </button>
      </div>

      {/* Right cluster: search + date range */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search"
            className={`${inputBase} w-full pl-9 sm:w-64`}
            aria-label="Search responses"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(event) => onFromDateChange(event.target.value)}
            className={inputBase}
            aria-label="From date"
          />
          <span className="text-xs text-gray-400">→</span>
          <input
            type="date"
            value={toDate}
            onChange={(event) => onToDateChange(event.target.value)}
            className={inputBase}
            aria-label="To date"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline icons (no extra dependency)
// ---------------------------------------------------------------------------

function ExcelIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-brand-dark"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M8 8l8 8" />
      <path d="M16 8l-8 8" />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

function ReloadIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      aria-hidden
    >
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
