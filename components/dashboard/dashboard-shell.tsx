"use client";

/**
 * Dashboard shell.
 *
 * Wraps every `/dashboard/*` page with sidebar + topbar. Owns the mobile
 * drawer state and resolves the current Supabase user (email + logout).
 *
 * Auth state is intentionally not gated here — `app/dashboard/layout.tsx`
 * still wraps everything in <AuthGuard>, which redirects unauthenticated
 * users to /login. We just *display* the email and call signOut.
 */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardSidebar from "./dashboard-sidebar";
import DashboardTopbar from "./dashboard-topbar";
import { supabase } from "@/lib/supabase";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | undefined>();

  // Resolve user email for sidebar footer + topbar avatar.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUserEmail(data.user?.email ?? undefined);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close drawer when transitioning to desktop breakpoint.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) setIsSidebarOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogout={handleLogout}
        userEmail={userEmail}
      />

      {/* Content column shifts right of the 240px sidebar on md+ */}
      <div className="md:pl-60">
        <DashboardTopbar
          onMenuClick={() => setIsSidebarOpen(true)}
          userEmail={userEmail}
        />
        <main>{children}</main>
      </div>
    </div>
  );
}
