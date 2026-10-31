/**
 * Presents authentication entry actions; Keycloak owns credential entry, registration, and recovery.
 */
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/pages/auth/brand-mark";
import "./auth-landing.css";

import keycloak from "../../keycloak";

// Return the application entry URL used after Keycloak finishes an authentication action.
function getAuthRedirectUri() {
  return `${window.location.origin}/`;
}

// Presents authentication entry actions; Keycloak owns credential entry, registration, and recovery.
export function AuthLanding() {
  return (
    <div className="page-auth-auth-landing">
      {/* Main screen content; shared navigation is composed separately. */}
      <main className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        {/* Group related content and controls in this screen section. */}
        <section className="flex flex-col justify-between bg-[var(--color-action-primary)]/10 p-8 md:p-12 lg:p-16">
          <div className="inline-flex items-center gap-3 text-[var(--color-text-primary)]">
            <BrandMark />
            <span className="text-sm font-bold tracking-[0.14em] text-[var(--color-action-primary)]">
              TSHR
            </span>
          </div>
          <div className="max-w-xl py-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">
              Trishakti HR
            </p>
            <h1 className="max-w-lg text-5xl font-bold tracking-[-0.05em] text-[var(--color-text-primary)] md:text-6xl">
              People operations, made clearer.
            </h1>
            <p className="mt-6 max-w-md text-lg leading-8 text-[var(--color-text-secondary)]">
              A focused workspace for hiring, candidate screening, onboarding,
              and employee records.
            </p>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Secure access powered by Keycloak
          </p>
        </section>
        {/* Group related content and controls in this screen section. */}
        <section className="flex items-center justify-center bg-[var(--color-bg-surface)] p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <BrandMark />
              <span className="text-sm font-bold tracking-[0.14em] text-[var(--color-action-primary)]">
                TSHR
              </span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-action-primary)]">
              Welcome back
            </p>
            <h2 className="text-3xl font-bold tracking-[-0.04em] text-[var(--color-text-primary)]">
              Sign in to TSHR
            </h2>
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              Use your organization account to continue.
            </p>
            <div className="mt-8 space-y-3">
              <Button
                className="w-full"
                onClick={() =>
                  keycloak.login({ redirectUri: getAuthRedirectUri() })
                }
              >
                Sign in
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() =>
                  keycloak.register({ redirectUri: getAuthRedirectUri() })
                }
              >
                Create an account
              </Button>
              <button
                type="button"
                className="mt-2 block w-full text-center text-sm font-semibold text-[var(--color-action-primary)]"
                onClick={() =>
                  keycloak.login({ redirectUri: getAuthRedirectUri() })
                }
              >
                Forgot your password?
              </button>
            </div>
            <p className="mt-8 text-center text-xs leading-6 text-[var(--color-text-secondary)]">
              Password recovery is handled securely by Keycloak. Select the
              forgot password link on the sign-in screen.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
