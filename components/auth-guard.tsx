"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Client-side route guard for dashboard pages.
 *
 * - On mount: checks the current Supabase session.
 * - If no session: redirects to /login.
 * - If session: renders children.
 * - Subscribes to auth state changes so a logout elsewhere kicks the user
 *   back to /login automatically.
 *
 * This is a soft guard (UI only). Tighten with row-level security and
 * server-side checks before going to production.
 */
export default function AuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "authed" | "anon">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (session) {
        setStatus("authed");
      } else {
        setStatus("anon");
        router.replace("/login");
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) return;
        if (session) {
          setStatus("authed");
        } else {
          setStatus("anon");
          router.replace("/login");
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-sm text-gray-500">Checking session...</p>
      </div>
    );
  }

  if (status === "anon") {
    // Redirect already in flight; render nothing to avoid a flash of content.
    return null;
  }

  return <>{children}</>;
}
