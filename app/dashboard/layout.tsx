import AuthGuard from "@/components/auth-guard";

/**
 * Dashboard segment layout.
 *
 * Wraps every route under `/dashboard/...` with the client-side AuthGuard
 * so unauthenticated users are bounced to /login. Public routes (`/`,
 * `/login`, `/form/[slug]`) live outside this segment and stay open.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
