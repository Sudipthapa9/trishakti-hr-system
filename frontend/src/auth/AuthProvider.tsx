/** Keeps the Keycloak session and role display synchronized without storing tokens. */
import { useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import keycloak from "@/keycloak";
import { AuthContext, type AuthState } from "./auth-context";
import { hasWorkspaceAccess } from "./workspace-access";

// The adapter can initialize only once, including during React StrictMode remounts.
let initialization: Promise<boolean> | undefined;
const returnKey = "trishakti:return-to";
function initialize() {
  if (!initialization) {
    const path = window.location.pathname;
    const isPublic =
      path === "/404" || path === "/careers" || path.startsWith("/careers/");
    if (!isPublic && path !== "/")
      sessionStorage.setItem(returnKey, path + window.location.search);
    initialization = keycloak.init({
      onLoad: isPublic ? undefined : "check-sso",
      redirectUri: window.location.origin + "/",
      pkceMethod: "S256",
      checkLoginIframe: false,
    });
  }
  return initialization;
}
function readIdentity() {
  const claim = keycloak.tokenParsed?.realm_access?.roles;
  const roles = Array.isArray(claim)
    ? claim.filter((role): role is string => typeof role === "string")
    : [];
  return {
    username: keycloak.tokenParsed?.preferred_username || "User",
    roles: roles.filter((role) => ["hr", "hr-head", "manager"].includes(role)),
  };
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [showWelcome, setShowWelcome] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [identity, setIdentity] = useState({
    username: "User",
    roles: [] as string[],
  });
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    function signedOut() {
      if (!active) return;
      setAuthState("signed-out");
      setShowWelcome(false);
      setIdentity({ username: "User", roles: [] });
    }
    function synchronize() {
      if (!active) return;
      setIdentity(readIdentity());
      setAuthState(keycloak.authenticated ? "signed-in" : "signed-out");
      if (keycloak.authenticated) setAuthError(null);
    }
    function expireSession() {
      keycloak.clearToken();
      signedOut();
    }
    keycloak.onAuthLogout = signedOut;
    keycloak.onAuthSuccess = synchronize;
    keycloak.onAuthRefreshSuccess = synchronize;
    keycloak.onAuthRefreshError = expireSession;
    keycloak.onTokenExpired = () => {
      void keycloak.updateToken(30).catch(expireSession);
    };
    void initialize()
      .then((authenticated) => {
        if (!active) return;
        synchronize();
        setShowWelcome(authenticated);
        if (authenticated) {
          const returnTo = sessionStorage.getItem(returnKey);
          sessionStorage.removeItem(returnKey);
          if (returnTo?.startsWith("/") && !returnTo.startsWith("//"))
            navigate(returnTo, { replace: true });
        }
      })
      .catch(() => {
        if (active)
          setAuthError(
            "Could not connect to sign-in. Check Keycloak and reload this page.",
          );
        signedOut();
      });
    // Refresh proactively so an idle workspace does not retain an expired token.
    const timer = window.setInterval(() => {
      if (keycloak.authenticated)
        void keycloak.updateToken(60).catch(expireSession);
    }, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
      keycloak.onAuthLogout = undefined;
      keycloak.onAuthSuccess = undefined;
      keycloak.onAuthRefreshSuccess = undefined;
      keycloak.onAuthRefreshError = undefined;
      keycloak.onTokenExpired = undefined;
    };
  }, [navigate]);
  return (
    <AuthContext.Provider
      value={{
        authState,
        showWelcome,
        authError,
        ...identity,
        roleLabel: identity.roles.length
          ? identity.roles.join(", ")
          : "Access pending",
        canAccessWorkspace: hasWorkspaceAccess(identity.roles),
        continueToWorkspace: () => setShowWelcome(false),
        refreshAccess: async () => {
          if (!keycloak.authenticated) throw new Error("Please sign in again.");
          await keycloak.updateToken(-1);
          setIdentity(readIdentity());
        },
        logout: () => {
          void keycloak
            .logout({ redirectUri: window.location.origin + "/" })
            .catch(() => {
              keycloak.clearToken();
              setAuthState("signed-out");
              setShowWelcome(false);
              setIdentity({ username: "User", roles: [] });
              setAuthError(
                "Signed out of this page, but Keycloak could not be reached. Your single sign-on session may still be active.",
              );
            });
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
