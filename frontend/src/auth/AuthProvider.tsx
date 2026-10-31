/**
 * Initializes Keycloak and exposes session state. Only the requested return path is stored in sessionStorage; access tokens are not stored here.
 */
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import keycloak from "@/keycloak";
import { AuthContext, type AuthState } from "./auth-context";

// Initializes Keycloak and exposes session state. Only the requested return path is stored in sessionStorage; access tokens are not stored here.
export function AuthProvider({ children }: { children: ReactNode }) {
  // Keep authState in component state; updates trigger a render.
  const [authState, setAuthState] = useState<AuthState>("loading");
  // Keep showWelcome in component state; updates trigger a render.
  const [showWelcome, setShowWelcome] = useState(false);
  // Preserve isInitialized between renders without scheduling another render.
  const isInitialized = useRef(false);
  const navigate = useNavigate();

  // Run the lifecycle work after rendering; the dependency list controls when it runs again.
  useEffect(() => {
    // React StrictMode can rerun effects in development; initialize this Keycloak instance only once.
    if (isInitialized.current) return;
    isInitialized.current = true;
    keycloak.onAuthLogout = () => {
      setAuthState("signed-out");
      setShowWelcome(false);
    };
    const path = window.location.pathname;
    // Public careers pages must not require a sign-in redirect just to render.
    const isPublic =
      path === "/careers" || path.startsWith("/careers/") || path === "/404";
    const returnKey = "trishakti:return-to";
    if (!isPublic && path !== "/") {
      // Remember navigation only, never access or refresh tokens.
      sessionStorage.setItem(returnKey, path + window.location.search);
    }
    keycloak
      .init({
        onLoad: isPublic ? undefined : "check-sso",
        // Use the registered application entry URL; restore the requested path after sign-in.
        redirectUri: window.location.origin + "/",
        pkceMethod: "S256",
        checkLoginIframe: false,
      })
      .then((authenticated) => {
        setAuthState(authenticated ? "signed-in" : "signed-out");
        setShowWelcome(authenticated);
        if (authenticated) {
          const returnTo = sessionStorage.getItem(returnKey);
          sessionStorage.removeItem(returnKey);
          // Accept only an application-relative return path, not an external protocol-relative URL.
          if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
            navigate(returnTo, { replace: true });
          }
        }
      })
      .catch((error) => {
        console.error("Keycloak initialization failed:", error);
        setAuthState("signed-out");
      });
  }, [navigate]);

  const roles = keycloak.tokenParsed?.realm_access?.roles ?? [];
  const relevantRoles = roles.filter((role) =>
    ["hr", "hr-head", "manager"].includes(role),
  );
  return (
    <AuthContext.Provider
      value={{
        authState,
        showWelcome,
        username: keycloak.tokenParsed?.preferred_username ?? "Unknown user",
        roleLabel: relevantRoles.length
          ? relevantRoles.join(", ")
          : "Standard user",
        continueToWorkspace: () => setShowWelcome(false),
        logout: () => {
          void keycloak.logout({ redirectUri: window.location.origin + "/" });
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
