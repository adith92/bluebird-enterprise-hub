import { Link, useLocation } from "wouter";
import { LayoutDashboard, ShoppingCart, Car, UserCircle, Wallet, Users, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/sales", label: "Sales", icon: ShoppingCart, exact: false },
  { href: "/operations", label: "Fleet", icon: Car, exact: false },
  { href: "/operations/drivers", label: "Drivers", icon: UserCircle, exact: false },
  { href: "/finance", label: "Finance", icon: Wallet, exact: false },
  { href: "/clients", label: "Clients", icon: Users, exact: false },
];

function isActive(location: string, item: (typeof NAV_ITEMS)[0]): boolean {
  if (item.exact) return location === item.href;
  // Don't let /operations match /operations/drivers
  if (item.href === "/operations") {
    return location === "/operations" || (location.startsWith("/operations") && !location.startsWith("/operations/drivers"));
  }
  return location === item.href || location.startsWith(item.href + "/");
}

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden border-r bg-sidebar md:block md:w-64 lg:w-72 shrink-0">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Car className="h-6 w-6" />
          Bluebird Hub
        </div>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
                isActive(location, item)
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                  : "text-sidebar-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function MobileNav() {
  const [location] = useLocation();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0">
        <div className="flex h-16 shrink-0 items-center px-6 border-b">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
            <Car className="h-6 w-6" />
            Bluebird Hub
          </div>
        </div>
        <nav className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
                  isActive(location, item)
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                    : "text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  // Only show 5 most important items in bottom nav (space-constrained)
  const bottomItems = NAV_ITEMS.slice(0, 5);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t bg-background h-16">
      {bottomItems.map((item) => {
        const active = isActive(location, item);
        return (
          <Link key={item.href} href={item.href} className="flex-1">
            <div
              className={cn(
                "flex flex-col items-center justify-center h-full gap-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span>{item.label}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
