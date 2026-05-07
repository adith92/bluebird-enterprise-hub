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
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || `${BASE}/api`).replace(/\/$/, "");
const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

const DEMO_USERS: Record<string, { displayName: string; role: UserRole; password: string }> = {
  gm: { displayName: "General Manager", role: "gm", password: "bluebird" },
  sales: { displayName: "Sales Team", role: "sales", password: "bluebird" },
  operations: { displayName: "Operations Team", role: "operations", password: "bluebird" },
  finance: { displayName: "Finance Team", role: "finance", password: "bluebird" },
  admin: { displayName: "Demo Admin", role: "gm", password: "admin" },
};

function loadDemoUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("bb_demo_user");
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function saveDemoUser(user: AuthUser | null) {
  if (!user) {
    localStorage.removeItem("bb_demo_user");
    return;
  }
  localStorage.setItem("bb_demo_user", JSON.stringify(user));
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
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
    if (DEMO_MODE) {
      setUser(loadDemoUser());
      setLoading(false);
      return;
    }

    apiFetch("/auth/me")
      .then(async (res) => {
        if (res.ok) setUser(await res.json());
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username: string, password: string) => {
    if (DEMO_MODE) {
      const key = username.trim().toLowerCase();
      const pass = password.trim();
      const demo = DEMO_USERS[key];
      if (!demo || demo.password !== pass) throw new Error("Invalid credentials");
      const demoUser: AuthUser = {
        id: 1,
        username: key,
        displayName: demo.displayName,
        role: demo.role,
      };
      setUser(demoUser);
      saveDemoUser(demoUser);
      return;
    }

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

  const loginWithGoogle = async (idToken: string) => {
    if (DEMO_MODE) {
      // In demo mode without backend, treat Google as "gm".
      const demoUser: AuthUser = { id: 2, username: "google-demo", displayName: "Google Demo", role: "gm" };
      setUser(demoUser);
      saveDemoUser(demoUser);
      return;
    }

    const res = await apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Google login failed");
    }
    const data: AuthUser = await res.json();
    setUser(data);
  };

  const logout = async () => {
    if (DEMO_MODE) {
      setUser(null);
      saveDemoUser(null);
      return;
    }
    await apiFetch("/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
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
  gm: ["/", "/sales", "/operations", "/operations/drivers", "/operations/dispatch", "/finance", "/clients", "/clients/new"],
  sales: ["/sales", "/clients", "/clients/new"],
  operations: ["/operations", "/operations/drivers", "/operations/dispatch"],
  finance: ["/finance", "/clients", "/clients/new"],
};

export const ROLE_HOME: Record<UserRole, string> = {
  gm: "/",
  sales: "/sales",
  operations: "/operations",
  finance: "/finance",
};
