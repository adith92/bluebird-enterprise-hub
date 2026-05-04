import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type UserRole = "gm" | "sales" | "operations" | "finance";

export interface AuthUser {
  id: number;
  username: string;
  displayName: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  return res;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/auth/me")
      .then(async (res) => {
        if (res.ok) setUser(await res.json());
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Login failed");
    }
    const data: AuthUser = await res.json();
    setUser(data);
  };

  const logout = async () => {
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  gm: "General Manager",
  sales: "Sales",
  operations: "Operations",
  finance: "Finance",
};

export const ROLE_NAV_ITEMS: Record<UserRole, string[]> = {
  gm: ["/", "/sales", "/operations", "/operations/drivers", "/finance", "/clients"],
  sales: ["/sales", "/clients"],
  operations: ["/operations", "/operations/drivers"],
  finance: ["/finance", "/clients"],
};

export const ROLE_HOME: Record<UserRole, string> = {
  gm: "/",
  sales: "/sales",
  operations: "/operations",
  finance: "/finance",
};
