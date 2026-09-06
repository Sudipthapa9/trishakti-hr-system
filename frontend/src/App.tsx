import { useEffect, useState, useRef } from "react";
import keycloak from "./keycloak";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [apiResult, setApiResult] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<number | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    keycloak
      .init({
        onLoad: "login-required",
        pkceMethod: "S256",
        checkLoginIframe: false, // REQUIRED for local development
      })
      .then((auth) => {
        console.log("Authenticated successfully:", auth);
        setAuthenticated(auth);
      })
      .catch((err) => {
        console.error("Keycloak init failed:", err);
        setAuthenticated(false);
      });
  }, []);
  const testProtectedRoute = async () => {
    setApiResult(null);
    setApiStatus(null);

    try {
      // Automatically refresh token if it's expired or expires within 30 seconds
      await keycloak.updateToken(30);

      const res = await fetch("http://localhost:4000/api/test/hr-only", {
        headers: {
          Authorization: `Bearer ${keycloak.token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      setApiStatus(res.status);
      setApiResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error("API Request Error:", err);
      setApiStatus(500);
      setApiResult("Request failed — check CORS or ensure backend is running.");
    }
  };

  if (!authenticated) {
    return <div style={{ padding: 40 }}>Initializing authentication...</div>;
  }

  const roles: string[] = keycloak.tokenParsed?.realm_access?.roles || [];
  const username: string = keycloak.tokenParsed?.preferred_username || "Unknown User";
  const relevantRoles = roles.filter((r) =>
    ["hr", "hr-head", "manager"].includes(r)
  );

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 500 }}>
      <h1>Trishakti HR System</h1>

      <div
        style={{
          padding: 16,
          background: "#f0f0f0",
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <p>
          <strong>Logged in as:</strong> {username}
        </p>
        <p>
          <strong>Roles:</strong>{" "}
          {relevantRoles.length > 0 ? relevantRoles.join(", ") : "none"}
        </p>
      </div>

      <button
        onClick={testProtectedRoute}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        Test HR-only backend route
      </button>

      {apiStatus !== null && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: apiStatus === 200 ? "#d4edda" : "#f8d7da",
            color: apiStatus === 200 ? "#155724" : "#721c24",
            borderRadius: 8,
          }}
        >
          <p>
            <strong>Status:</strong> {apiStatus}
          </p>
          <p>
            <strong>Response:</strong>
          </p>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {apiResult}
          </pre>
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;