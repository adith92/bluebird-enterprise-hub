import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth, ROLE_HOME } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, AlertCircle } from "lucide-react";

const DEMO_ACCOUNTS = [
  { username: "gm",         label: "General Manager",  desc: "All modules"       },
  { username: "sales",      label: "Sales",            desc: "Sales & Clients"   },
  { username: "operations", label: "Operations",       desc: "Fleet & Drivers"   },
  { username: "finance",    label: "Finance",          desc: "Finance & Clients" },
];

export default function Login() {
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLocation(ROLE_HOME[user.role]);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (uname: string) => {
    setUsername(uname);
    setPassword("bluebird");
    setError("");
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-2xl">
            <Car className="h-8 w-8" />
            Bluebird Hub
          </div>
          <p className="text-sm text-muted-foreground">
            B2B Enterprise Fleet Management
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access the system.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="e.g. gm, sales, operations, finance"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Demo Accounts
            </CardTitle>
            <CardDescription className="text-xs">
              Password for all accounts:{" "}
              <span className="font-mono font-semibold text-foreground">bluebird</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((acct) => (
              <button
                key={acct.username}
                type="button"
                onClick={() => fillDemo(acct.username)}
                className="text-left rounded-lg border bg-card p-3 hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <p className="font-medium text-sm group-hover:text-primary">{acct.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{acct.desc}</p>
                <p className="text-xs font-mono text-muted-foreground/70 mt-1">{acct.username}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
