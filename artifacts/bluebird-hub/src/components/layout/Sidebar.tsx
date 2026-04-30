import { Link, useLocation } from "wouter";
import { LayoutDashboard, ReceiptText, Users, Car, UserCircle, Search, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: ReceiptText },
  { href: "/operations", label: "Fleet", icon: Car },
  { href: "/operations/drivers", label: "Drivers", icon: UserCircle },
  { href: "/finance", label: "Finance", icon: ReceiptText },
  { href: "/clients", label: "Clients", icon: Users },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="hidden border-r bg-sidebar md:block md:w-64 lg:w-72">
      <div className="flex h-16 shrink-0 items-center px-6 border-b">
        <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
          <Car className="h-6 w-6" />
          Bluebird Hub
        </div>
      </div>
      <div className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
                  isActive ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </div>
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
            Bluebird
          </div>
        </div>
        <div className="flex flex-col gap-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer",
                    isActive ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground" : "text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
