"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ButtonLink from "@/components/button-link";
import { supabase } from "@/lib/supabase";


// Anchor links for landing-page sections. Hrefs use the `/#id` form so
// they also work when the header is mounted on a non-home route.
const sectionLinks: { id: SectionId; href: string; label: string }[] = [
  { id: "features", href: "/#features", label: "Features" },
  { id: "use-cases", href: "/#use-cases", label: "Use Cases" },
  { id: "pricing", href: "/#pricing", label: "Pricing" },
];

type SectionId = "features" | "use-cases" | "pricing";

export default function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();

  // Auth state -- avoids flashing the wrong CTAs before getSession resolves.
  const [authState, setAuthState] = useState<"loading" | "authed" | "anon">(
    "loading",
  );

  // Currently active marketing section (only meaningful on `/`). When the
  // user clicks a nav link we set this immediately so the active style
  // doesn't lag behind the scroll animation.
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  // ----- Auth subscription ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      setAuthState(session ? "authed" : "anon");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        setAuthState(session ? "authed" : "anon");
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  // ----- Section visibility tracking (only on home) -----------------------

  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection(null);
      return;
    }
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const ids: SectionId[] = ["features", "use-cases", "pricing"];
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // Track each section's intersection ratio so we can pick the one most
    // visible in the viewport at any given scroll position.
    const ratios = new Map<SectionId, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id as SectionId;
          ratios.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        let bestId: SectionId | null = null;
        let bestRatio = 0;
        ratios.forEach((ratio, id) => {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        });

        // Only clear when nothing is meaningfully visible.
        setActiveSection(bestRatio > 0.2 ? bestId : null);
      },
      {
        // Bias the active band toward the upper-middle of the viewport so the
        // navbar agrees with what the user is actually reading.
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  // ----- Click handler: smooth scroll on home, fall back to navigation ----

  const handleSectionClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, id: SectionId) => {
      if (pathname === "/" && typeof window !== "undefined") {
        const target = document.getElementById(id);
        if (target) {
          e.preventDefault();
          // Optimistic active state -- the IO will confirm shortly after.
          setActiveSection(id);
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          // Update the URL hash without triggering Next router navigation.
          history.replaceState(null, "", `#${id}`);
        }
      }
      // On other routes, let the browser navigate to /#id normally.
    },
    [pathname],
  );

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Hide the marketing/app navbar on public customer-facing form pages.
  // Customers see the form as a standalone page so they don't get
  // confused by the FormWhats brand or "Login" CTAs that aren't theirs.
  if (pathname?.startsWith("/form/")) {
    return null;
  }

  // Hide on `/dashboard/*` — those routes have their own sidebar + topbar
  // shell (see components/dashboard/dashboard-shell.tsx). Showing both
  // would double up navigation and waste vertical space.
  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b border-gray-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">

      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        {/* Logo + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
          aria-label="FormWhats home"
        >
          <Image
            src="/logo.png"
            alt=""
            width={32}
            height={32}
            priority
            className="h-8 w-8 rounded-full"
          />
          <span className="text-lg font-bold tracking-tight text-black">
            Form<span className="text-brand">Whats</span>
          </span>
        </Link>


        {/* Desktop section links — only useful when logged out (marketing) */}
        {authState !== "authed" && (
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Primary"
          >
            {sectionLinks.map((link) => {
              const isActive = activeSection === link.id;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(e) => handleSectionClick(e, link.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={[
                    "group relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                    isActive
                      ? "text-brand-dark"
                      : "text-gray-600 hover:text-black",
                  ].join(" ")}
                >
                  <span
                    aria-hidden
                    className={[
                      "absolute inset-0 rounded-full bg-brand/10 transition-all duration-300",
                      isActive
                        ? "scale-100 opacity-100"
                        : "scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-60",
                    ].join(" ")}
                  />
                  <span className="relative">{link.label}</span>
                  <span
                    aria-hidden
                    className={[
                      "absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-brand transition-all duration-300 ease-out",
                      isActive
                        ? "h-[3px] w-6 opacity-100"
                        : "h-[3px] w-0 opacity-0 group-hover:w-3 group-hover:opacity-60",
                    ].join(" ")}
                  />
                </a>
              );
            })}
          </nav>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {authState === "loading" ? (
            <span className="h-8 w-32" aria-hidden="true" />
          ) : authState === "authed" ? (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-gray-600 transition hover:text-black sm:inline"
              >
                Dashboard
              </Link>
              <ButtonLink
                href="/dashboard/forms/new"
                variant="secondary"
                className="!py-2 !px-4 !text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Create Form
              </ButtonLink>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-black transition-all hover:bg-gray-50 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-black"
              >
                Login
              </Link>
              <ButtonLink
                href="/login"
                variant="primary"
                className="!py-2 !px-4 !text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Get Started
              </ButtonLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
