/**
 * Requires sign-in and an HR workspace role before mounting protected pages.
 */
import { Outlet } from "react-router-dom";
import { AuthLanding } from "@/pages/auth/auth-landing";
import { useAuth } from "./auth-context";
import { AccessPendingPage } from "./AccessPendingPage";

// This gate improves the UI; each API endpoint still enforces authorization.
// Read the required workspace values and pass them to the corresponding page component.
export function ProtectedRoute() {
  const { authState, canAccessWorkspace } = useAuth();
  if (authState !== "signed-in") return <AuthLanding />;
  return canAccessWorkspace ? <Outlet /> : <AccessPendingPage />;
}
