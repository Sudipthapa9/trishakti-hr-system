// src/App.tsx
import { useEffect, useState } from "react";
import keycloak from "./keycloak";

function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    keycloak.init({ onLoad: "login-required", pkceMethod: "S256" })
      .then((auth) => setAuthenticated(auth));
  }, []);

  if (!authenticated) return <div>Loading...</div>;

  return <div>Logged in. Token: {keycloak.token}</div>;
}

export default App;
