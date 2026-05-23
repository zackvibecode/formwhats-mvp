"use client";

/**
 * Canvas droppable zone.
 *
 * Wraps the field list with a dnd-kit `useDroppable` so the parent page can
 * detect drops coming from the field library (id prefix `library:*`) and
 * route them into "create new field". Reorder drags on existing fields are
 * still handled by the inner SortableContext (collisionDetection picks the
 * closest sortable item first, so this canvas-level droppable only matches
 * when a library item is dropped on empty space or on a field card).
 *
 * This is purely visual + dnd wiring: no business logic, no state.
 */

import { useDroppable } from "@dnd-kit/core";
import type { ReactNode } from "react";

export const CANVAS_DROPPABLE_ID = "canvas-droppable";

type CanvasDroppableProps = {
  /** True while ANY item is being dragged from the library. Adds a visible
   *  highlight so the user knows where the drop target is. */
  isLibraryDragging: boolean;
  children: ReactNode;
};

export default function CanvasDroppable({
  isLibraryDragging,
  children,
}: CanvasDroppableProps) {
  const { setNodeRef, isOver } = useDroppable({ id: CANVAS_DROPPABLE_ID });

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-2xl transition-all",
        isLibraryDragging
          ? isOver
            ? "bg-brand/5 ring-2 ring-brand/40"
            : "ring-1 ring-dashed ring-gray-300"
          : "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
