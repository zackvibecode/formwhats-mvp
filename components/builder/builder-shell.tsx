"use client";

import type { ReactNode } from "react";

type BuilderShellProps = {
  topbar: ReactNode;
  /** Left rail (Field Library). Hidden below lg by default for clarity. */
  leftPanel: ReactNode;
  /** Centre canvas (existing form details + field list + save banners). */
  canvas: ReactNode;
  /** Right rail (Field Settings). Hidden below lg. */
  rightPanel: ReactNode;
};

/**
 * Three-panel SaaS builder shell. Mounts on a soft gray background to
 * push the white panels forward.
 *
 * Layout strategy:
 *   - Mobile/tablet: stacks vertically (topbar -> left -> canvas -> right)
 *   - Desktop (lg+): left ~260px / canvas flex / right ~320px
 *
 * Sticky behavior: side panels stay in view as the canvas scrolls so the
 * field library is always reachable.
 */
export default function BuilderShell({
  topbar,
  leftPanel,
  canvas,
  rightPanel,
}: BuilderShellProps) {
  return (
    <div className="-mx-4 min-h-[calc(100vh-4rem)] bg-gray-50 px-4 pb-12 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      {topbar}

      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-5 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        {/* Left rail */}
        <div className="order-2 lg:order-1">
          <div className="lg:sticky lg:top-[125px]">{leftPanel}</div>
        </div>

        {/* Canvas */}
        <main className="order-1 lg:order-2">{canvas}</main>

        {/* Right rail */}
        <div className="order-3">
          <div className="lg:sticky lg:top-[125px]">{rightPanel}</div>
        </div>
      </div>
    </div>
  );
}
