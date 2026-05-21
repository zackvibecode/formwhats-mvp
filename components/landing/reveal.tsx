"use client";

import { useEffect, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Per-item stagger in milliseconds applied via inline style. */
  delay?: number;
  /** Element tag to render. Defaults to a `div`. */
  as?: ElementType;
  /** Custom Tailwind classes appended to the reveal container. */
  className?: string;
};

/**
 * Wraps children in a container that fades + slides up the first time it
 * enters the viewport. Uses IntersectionObserver and disconnects after
 * firing so animations don't replay on scroll back.
 *
 * Server renders the element invisible (opacity-0); the client effect
 * flips it to visible. This avoids hydration warnings because both
 * server and client agree on the initial markup.
 */
export default function Reveal({
  children,
  delay = 0,
  as,
  className = "",
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // Already in view on mount? Show without animation jitter.
    if (typeof window !== "undefined" && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setVisible(true);
              observer.disconnect();
            }
          });
        },
        {
          threshold: 0.15,
          rootMargin: "0px 0px -10% 0px",
        },
      );

      observer.observe(node);
      return () => observer.disconnect();
    }

    // No IO support -> show immediately.
    setVisible(true);
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
      className={[
        "transform transition-[opacity,transform] duration-700 ease-out",
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      ].join(" ")}
    >
      {children}
    </Tag>
  );
}
