/**
 * Restricts workspace rendering to signed-in sessions. This frontend check does not replace server authorization.
 */
import { Outlet } from "react-router-dom";
import { AuthLanding } from "@/pages/auth/auth-landing";
import { useAuth } from "./auth-context";

// Authentication gate only. Business-role authorization belongs in the API.
// Read the required workspace values and pass them to the corresponding page component.
export function ProtectedRoute() {
  const { authState } = useAuth();
  return authState === "signed-in" ? <Outlet /> : <AuthLanding />;
}
