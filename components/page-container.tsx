import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Centered max-width wrapper with consistent horizontal & vertical padding.
 * Use on every main page to keep spacing uniform across the app.
 */
export default function PageContainer({
  children,
  className = "",
}: PageContainerProps) {
  return (
    <main className={`mx-auto w-full max-w-5xl px-6 py-12 sm:py-16 ${className}`.trim()}>
      {children}
    </main>
  );
}
