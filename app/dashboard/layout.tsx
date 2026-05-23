import AuthGuard from "@/components/auth-guard";
import DashboardShell from "@/components/dashboard/dashboard-shell";

/**
 * Dashboard segment layout.
 *
 * Wraps every route under `/dashboard/...` with:
 *   1. <AuthGuard> — bounces unauthenticated users to /login.
 *   2. <DashboardShell> — sidebar + topbar chrome shared by all pages.
 *
 * Public routes (`/`, `/login`, `/form/[slug]`) live outside this segment
 * and stay open / use the marketing <SiteHeader>.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardShell>{children}</DashboardShell>
    </AuthGuard>
  );
}
