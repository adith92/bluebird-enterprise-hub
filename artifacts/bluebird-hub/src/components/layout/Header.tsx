import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./Sidebar";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useGlobalSearch } from "@workspace/api-client-react";
import { useDebounce } from "@/hooks/use-debounce";

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        {/* Desktop search bar */}
        <div className="hidden md:flex">
          <Button
            variant="outline"
            className="w-64 justify-start text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            Search everywhere...
            <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>
        </div>
        {/* Mobile search icon */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-muted-foreground"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
          <span className="sr-only">Search</span>
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="rounded-full bg-muted">
          <User className="h-5 w-5" />
        </Button>
      </div>
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

function GlobalSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [, setLocation] = useLocation();

  const { data: results, isLoading } = useGlobalSearch(
    { q: debouncedQuery },
    { query: { enabled: debouncedQuery.length > 1 } }
  );

  const handleSelect = (href: string) => {
    onOpenChange(false);
    setLocation(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search orders, vehicles, clients, drivers..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && <CommandEmpty>Searching...</CommandEmpty>}
        {!isLoading &&
          debouncedQuery.length > 1 &&
          !results?.orders.length &&
          !results?.vehicles.length &&
          !results?.clients.length &&
          !results?.drivers.length && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

        {results?.orders && results.orders.length > 0 && (
          <CommandGroup heading="Orders">
            {results.orders.map((order) => (
              <CommandItem
                key={`order-${order.id}`}
                onSelect={() => handleSelect(`/sales/${order.id}`)}
              >
                <span className="font-medium">{order.orderNumber}</span>
                <span className="ml-2 text-muted-foreground">
                  — {order.clientName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.vehicles && results.vehicles.length > 0 && (
          <CommandGroup heading="Vehicles">
            {results.vehicles.map((vehicle) => (
              <CommandItem
                key={`vehicle-${vehicle.id}`}
                onSelect={() =>
                  handleSelect(`/operations/vehicles/${vehicle.id}`)
                }
              >
                <span className="font-mono font-medium">
                  {vehicle.plateNumber}
                </span>
                <span className="ml-2 text-muted-foreground">
                  — {vehicle.model}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.clients && results.clients.length > 0 && (
          <CommandGroup heading="Clients">
            {results.clients.map((client) => (
              <CommandItem
                key={`client-${client.id}`}
                onSelect={() => handleSelect(`/clients/${client.id}`)}
              >
                {client.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results?.drivers && results.drivers.length > 0 && (
          <CommandGroup heading="Drivers">
            {results.drivers.map((driver) => (
              <CommandItem
                key={`driver-${driver.id}`}
                onSelect={() =>
                  handleSelect(`/operations/drivers/${driver.id}`)
                }
              >
                {driver.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
