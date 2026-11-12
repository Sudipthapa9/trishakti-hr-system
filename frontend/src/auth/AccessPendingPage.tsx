import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-context";

export function AccessPendingPage() {
  const { username, roles, refreshAccess, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await refreshAccess();
    } catch {
      setError("Could not refresh access. Sign in again and retry.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="grid min-h-screen place-items-center bg-[var(--color-bg-canvas)] p-6">
      <section className="grid max-w-lg gap-4 rounded-xl border bg-white p-8">
        <h1>
          {roles.includes("manager")
            ? "Workspace access is not enabled for this role"
            : "Access awaiting approval"}
        </h1>
        <p>Signed in as {username}.</p>
        <p>
          Your account is signed in, but it does not have an HR role for this
          workspace. Ask your administrator to assign the appropriate role.
        </p>
        <p>
          If your role was just updated, refresh access or sign out and sign
          back in.
        </p>
        {error && <p role="alert">{error}</p>}
        <Button disabled={busy} onClick={() => void refresh()}>
          {busy ? "Checking access…" : "Refresh access"}
        </Button>
        <Button variant="outline" onClick={logout}>
          Sign out
        </Button>
        <Link className="underline" to="/careers">
          View public careers
        </Link>
      </section>
    </main>
  );
}
