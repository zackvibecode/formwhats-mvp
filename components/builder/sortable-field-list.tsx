"use client";

import { type ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// --- Types -----------------------------------------------------------------

export type SortableItemBase = { id: string };

type SortableFieldListProps<T extends SortableItemBase> = {
  fields: T[];
  onReorder: (fields: T[]) => void;
  /**
   * Renderer for each field. Receives the field object and a `dragHandle`
   * ReactNode the caller can place wherever they want (typically left of
   * the card content). The drag handle wires up the necessary listeners
   * and attributes from dnd-kit.
   */
  renderField: (field: T, dragHandle: ReactNode) => ReactNode;
};

// --- Drag handle ----------------------------------------------------------

type DragHandleProps = {
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
  isDragging: boolean;
};

function DragHandle({ attributes, listeners, isDragging }: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label="Drag to reorder field"
      // Stop click from bubbling up to the parent card -- dnd-kit's
      // listeners already prevent default for pointer events that start
      // a drag, but a clean stopPropagation here keeps a normal click
      // from selecting the card.
      onClick={(e) => e.stopPropagation()}
      className={[
        "flex h-8 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
        isDragging ? "cursor-grabbing" : "cursor-grab",
      ].join(" ")}
      {...attributes}
      {...listeners}
    >
      {/* 6-dot grip */}
      <svg
        viewBox="0 0 12 16"
        width="12"
        height="16"
        fill="currentColor"
        aria-hidden
      >
        <circle cx="3" cy="3" r="1.4" />
        <circle cx="9" cy="3" r="1.4" />
        <circle cx="3" cy="8" r="1.4" />
        <circle cx="9" cy="8" r="1.4" />
        <circle cx="3" cy="13" r="1.4" />
        <circle cx="9" cy="13" r="1.4" />
      </svg>
    </button>
  );
}

// --- Sortable wrapper for a single item -----------------------------------

type SortableRowProps<T extends SortableItemBase> = {
  field: T;
  renderField: (field: T, dragHandle: ReactNode) => ReactNode;
};

function SortableRow<T extends SortableItemBase>({
  field,
  renderField,
}: SortableRowProps<T>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Lift the dragged item visually; non-dragged items keep their
    // natural transform/transition that dnd-kit applies for the slide.
    zIndex: isDragging ? 10 : "auto",
    opacity: isDragging ? 0.85 : 1,
    boxShadow: isDragging
      ? "0 12px 24px -8px rgba(0, 0, 0, 0.15)"
      : undefined,
    borderRadius: "0.75rem",
  };

  const handle = (
    <DragHandle
      attributes={attributes}
      listeners={listeners}
      isDragging={isDragging}
    />
  );

  return (
    <li ref={setNodeRef} style={style}>
      {renderField(field, handle)}
    </li>
  );
}

// --- Main component -------------------------------------------------------

export default function SortableFieldList<T extends SortableItemBase>({
  fields,
  onReorder,
  renderField,
}: SortableFieldListProps<T>) {
  // 8px activation distance prevents drags from triggering on
  // accidental click slips, and lets normal click events through.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(fields, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-3">
          {fields.map((field) => (
            <SortableRow
              key={field.id}
              field={field}
              renderField={renderField}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
