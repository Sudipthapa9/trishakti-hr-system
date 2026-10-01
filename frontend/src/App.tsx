import { useEffect, useRef, useState } from "react";
import keycloak from "./keycloak";

type AuthState = "loading" | "signed-out" | "signed-in";

function BrandMark() { return <span className="brand-mark">T</span>; }

function AuthLanding() {
  return (
    <main className="auth-layout">
      <section className="auth-intro">
        <div className="brand"><BrandMark /> <span>TSHR</span></div>
        <div className="intro-copy">
          <p className="eyebrow">Trishakti HR</p>
          <h1>People operations, made clearer.</h1>
          <p className="intro-text">A focused workspace for hiring, candidate screening, onboarding, and employee records.</p>
        </div>
        <p className="footer-note">Secure access powered by Keycloak</p>
      </section>
      <section className="auth-panel" aria-labelledby="auth-title">
        <div className="auth-card">
          <div className="mobile-brand brand"><BrandMark /> <span>TSHR</span></div>
          <p className="eyebrow">Welcome back</p>
          <h2 id="auth-title">Sign in to TSHR</h2>
          <p className="muted">Use your organization account to continue.</p>
          <button className="primary-button" onClick={() => keycloak.login({ redirectUri: window.location.origin })}>Sign in</button>
          <button className="secondary-button" onClick={() => keycloak.register({ redirectUri: window.location.origin })}>Create an account</button>
          <button className="text-button" onClick={() => keycloak.login({ redirectUri: window.location.origin })}>Forgot your password?</button>
          <p className="help-copy">Password recovery is handled securely by Keycloak. Select the forgot password link on the sign-in screen.</p>
        </div>
      </section>
    </main>
  );
}

function WelcomePage({ onContinue }: { onContinue: () => void }) {
  return (
    <main className="welcome-layout">
      <div className="welcome-card">
        <div className="welcome-icon"><BrandMark /></div>
        <p className="eyebrow">You are signed in</p>
        <h1>Welcome to TSHR</h1>
        <p className="welcome-copy">Your Trishakti HR workspace is ready. We are building the next set of people operations tools for your team.</p>
        <button className="primary-button" onClick={onContinue}>Continue to workspace</button>
        <p className="coming-soon">More features are coming soon.</p>
      </div>
    </main>
  );
}

function Workspace({ onLogout }: { onLogout: () => void }) {
  const roles: string[] = keycloak.tokenParsed?.realm_access?.roles || [];
  const username = keycloak.tokenParsed?.preferred_username || "Unknown user";
  const relevantRoles = roles.filter((role) => ["hr", "hr-head", "manager"].includes(role));
  return (
    <main className="workspace-layout">
      <header className="workspace-header"><div className="brand"><BrandMark /> <span>TSHR</span></div><button className="logout-button" onClick={onLogout}>Sign out</button></header>
      <section className="workspace-content">
        <p className="eyebrow">Workspace</p>
        <h1>Good to have you here.</h1>
        <p className="muted">The HR workspace is being prepared for your team.</p>
        <div className="profile-panel">
          <div><span className="panel-label">Signed in as</span><strong>{username}</strong></div>
          <div><span className="panel-label">Access</span><strong>{relevantRoles.length > 0 ? relevantRoles.join(", ") : "Standard user"}</strong></div>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [showWelcome, setShowWelcome] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    keycloak.onAuthLogout = () => { setAuthState("signed-out"); setShowWelcome(false); };
    keycloak.init({ onLoad: "check-sso", pkceMethod: "S256", checkLoginIframe: false })
      .then((authenticated) => { setAuthState(authenticated ? "signed-in" : "signed-out"); setShowWelcome(authenticated); })
      .catch((error) => { console.error("Keycloak initialization failed:", error); setAuthState("signed-out"); });
  }, []);

  if (authState === "loading") return <main className="loading-screen"><BrandMark /><p>Connecting securely...</p></main>;
  if (authState === "signed-out") return <AuthLanding />;
  if (showWelcome) return <WelcomePage onContinue={() => setShowWelcome(false)} />;
  return <Workspace onLogout={() => keycloak.logout({ redirectUri: window.location.origin })} />;
}

export default App;
