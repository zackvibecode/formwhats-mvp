import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type ButtonLinkVariant = "primary" | "secondary";

type ButtonLinkProps = {
  href: ComponentProps<typeof Link>["href"];
  children: ReactNode;
  variant?: ButtonLinkVariant;
  className?: string;
};

const baseStyles =
  "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2";

const variantStyles: Record<ButtonLinkVariant, string> = {
  primary: "bg-brand text-white shadow-sm hover:bg-brand-dark",
  secondary:
    "bg-white text-black border border-gray-300 hover:bg-gray-50",
};

export default function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: ButtonLinkProps) {
  const styles = `${baseStyles} ${variantStyles[variant]} ${className}`.trim();

  return (
    <Link href={href} className={styles}>
      {children}
    </Link>
  );
}
