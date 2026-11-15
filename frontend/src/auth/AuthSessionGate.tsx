/**
 * Shows the connection state, then renders the requested route directly.
 */
import { Outlet } from "react-router-dom";
import { BrandMark } from "@/pages/auth/brand-mark";
import { useAuth } from "./auth-context";

// Successful sign-in continues directly to the requested workspace route.
export function AuthSessionGate() {
  const { authState } = useAuth();
  if (authState === "loading")
    return (
      <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] text-[var(--color-action-primary)]">
        <div className="text-center">
          <BrandMark />
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">
            Connecting securely...
          </p>
        </div>
      </main>
    );
  return <Outlet />;
}
