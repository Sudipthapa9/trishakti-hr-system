/**
 * Shows connection and welcome states before rendering the matching child route.
 */
import { Outlet } from "react-router-dom";
import { BrandMark } from "@/pages/auth/brand-mark";
import { WelcomePage } from "@/pages/auth/welcome-page";
import { useAuth } from "./auth-context";

// Shows connection and welcome states before rendering the matching child route.
export function AuthSessionGate() {
  const { authState, showWelcome, continueToWorkspace } = useAuth();
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
  if (authState === "signed-in" && showWelcome)
    return <WelcomePage onContinue={continueToWorkspace} />;
  return <Outlet />;
}
