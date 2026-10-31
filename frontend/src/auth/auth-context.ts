/**
 * Defines the shared authentication contract and a guarded hook for reading it inside AuthProvider.
 */
import { createContext, useContext } from "react";

// Define AuthState so callers and implementations agree on the required data shape.
export type AuthState = "loading" | "signed-out" | "signed-in";
// Define AuthSession so callers and implementations agree on the required data shape.
export type AuthSession = {
  authState: AuthState;
  showWelcome: boolean;
  username: string;
  roleLabel: string;
  continueToWorkspace: () => void;
  logout: () => void;
};
// Use null as the missing-provider sentinel; the companion hook reports incorrect usage.
export const AuthContext = createContext<AuthSession | null>(null);
// Read the current authentication context and fail early if the provider is missing.
export function useAuth() {
  const session = useContext(AuthContext);
  if (!session) throw new Error("useAuth must be used inside AuthProvider");
  return session;
}
