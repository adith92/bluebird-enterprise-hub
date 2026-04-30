import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Shell } from "@/components/layout/Shell";
import NotFound from "@/pages/not-found";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        
        {/* Sales */}
        <Route path="/sales" component={OrdersList} />
        <Route path="/sales/new" component={CreateOrder} />
        <Route path="/sales/:id" component={OrderDetail} />
        
        {/* Operations */}
        <Route path="/operations" component={VehiclesList} />
        <Route path="/operations/vehicles/:id" component={VehicleDetail} />
        <Route path="/operations/drivers" component={DriversList} />
        <Route path="/operations/drivers/:id" component={DriverDetail} />
        
        {/* Finance */}
        <Route path="/finance" component={InvoicesList} />
        <Route path="/finance/invoices/:id" component={InvoiceDetail} />
        
        {/* Clients */}
        <Route path="/clients" component={ClientsList} />
        <Route path="/clients/:id" component={ClientDetail} />
        
        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
