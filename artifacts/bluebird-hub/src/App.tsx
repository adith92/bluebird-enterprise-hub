import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import { AuthProvider, useAuth, ROLE_HOME, ROLE_NAV_ITEMS } from "@/hooks/use-auth";

// Pages
import Dashboard from "@/pages/dashboard";
import OrdersList from "@/pages/sales/index";
import CreateOrder from "@/pages/sales/new";
import OrderDetail from "@/pages/sales/detail";
import VehiclesList from "@/pages/operations/vehicles/index";
import VehicleDetail from "@/pages/operations/vehicles/detail";
import DriversList from "@/pages/operations/drivers/index";
import DriverDetail from "@/pages/operations/drivers/detail";
import InvoicesList from "@/pages/finance/index";
import InvoiceDetail from "@/pages/finance/detail";
import ClientsList from "@/pages/clients/index";
import ClientDetail from "@/pages/clients/detail";
import CreateClient from "@/pages/clients/new";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const ROUTE_TO_NAV: Record<string, string> = {
  "/": "/",
  "/sales": "/sales",
  "/operations": "/operations",
  "/operations/drivers": "/operations/drivers",
  "/finance": "/finance",
  "/clients": "/clients",
};

function canAccess(pathname: string, allowedNavItems: string[]): boolean {
  const navKey = Object.keys(ROUTE_TO_NAV).find((pattern) => {
    if (pattern === "/") return pathname === "/";
    return pathname === pattern || pathname.startsWith(pattern + "/");
  });
  if (!navKey) return false;
  const nav = ROUTE_TO_NAV[navKey];
  return allowedNavItems.includes(nav);
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const allowed = ROLE_NAV_ITEMS[user.role];
  if (!canAccess(location, allowed)) {
    return <Redirect to={ROLE_HOME[user.role]} />;
  }

  return <>{children}</>;
}

function Router() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />

      <Route>
        {user ? (
          <Shell>
            <AuthGuard>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/sales" component={OrdersList} />
                <Route path="/sales/new" component={CreateOrder} />
                <Route path="/sales/:id" component={OrderDetail} />
                <Route path="/operations" component={VehiclesList} />
                <Route path="/operations/vehicles/:id" component={VehicleDetail} />
                <Route path="/operations/drivers" component={DriversList} />
                <Route path="/operations/drivers/:id" component={DriverDetail} />
                <Route path="/finance" component={InvoicesList} />
                <Route path="/finance/invoices/:id" component={InvoiceDetail} />
                <Route path="/clients" component={ClientsList} />
                <Route path="/clients/new" component={CreateClient} />
                <Route path="/clients/:id" component={ClientDetail} />
                <Route component={NotFound} />
              </Switch>
            </AuthGuard>
          </Shell>
        ) : (
          <Redirect to="/login" />
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
