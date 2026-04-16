import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { User, Role } from "@/lib/types";
import api from "@/lib/api";
import { isJwtExpired } from "@/lib/jwt";

/**
 * Auth model (current app):
 * - "Session" = JWT in localStorage + mirrored User JSON for UI (username, role).
 * - We do not call the server on every page load to confirm the user still exists.
 * - Invalid / revoked / deleted user is detected when an API returns 401 (see api interceptor).
 * - Token expiry is enforced client-side via JWT `exp` on load and when the window regains focus.
 * Backend should return 401 for expired, invalid, or revoked tokens so axios clears storage and redirects to /login.
 */

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: { username: string; password: string; email: string; role?: Role; tenantId?: string }) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function clearStoredSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncSessionFromStorage = useCallback(() => {
    const token = localStorage.getItem("token");
    const stored = localStorage.getItem("user");

    if (!token || isJwtExpired(token)) {
      if (token || stored) clearStoredSession();
      setUser(null);
      return;
    }

    if (!stored) {
      clearStoredSession();
      setUser(null);
      return;
    }

    try {
      setUser(JSON.parse(stored) as User);
    } catch {
      clearStoredSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    syncSessionFromStorage();
    setIsLoading(false);
  }, [syncSessionFromStorage]);

  useEffect(() => {
    const onFocus = () => syncSessionFromStorage();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [syncSessionFromStorage]);

  const login = async (username: string, password: string) => {
    const { data } = await api.post("/auth/login", { username, password });
    const u: User = { username: data.username, role: data.role, token: data.token };
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const register = async (body: { username: string; password: string; email: string; role?: Role; tenantId?: string }) => {
    const { data } = await api.post("/auth/register", body);
    const u: User = { username: data.username, role: data.role, token: data.token };
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    clearStoredSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
