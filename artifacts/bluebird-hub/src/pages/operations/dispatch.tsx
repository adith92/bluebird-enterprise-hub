import { useMemo, useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useDraggable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type DispatchOrder = {
  id: number;
  orderNumber: string;
  clientName: string;
  startDate: string;
  endDate: string;
  status: "draft" | "active";
  vehicleId?: number | null;
  driverId?: number | null;
};

type DispatchVehicle = { id: number; plateNumber: string; model: string; status: "available" | "booked" | "maintenance" };
type DispatchDriver = { id: number; name: string; status: "available" | "on_trip" | "off_duty" };

const DEMO_MODE = String(import.meta.env.VITE_DEMO_MODE || "").toLowerCase() === "true";

const DEMO_ORDERS: DispatchOrder[] = [
  { id: 101, orderNumber: "BB-2026-0001", clientName: "PT Nusantara Logistik", startDate: "2026-05-10", endDate: "2026-05-11", status: "draft" },
  { id: 102, orderNumber: "BB-2026-0002", clientName: "PT Metro Retail", startDate: "2026-05-10", endDate: "2026-05-12", status: "draft" },
];

const DEMO_VEHICLES: DispatchVehicle[] = [
  { id: 201, plateNumber: "B 1234 BB", model: "Toyota Hiace", status: "available" },
  { id: 202, plateNumber: "B 7788 BB", model: "Mercedes Sprinter", status: "available" },
  { id: 203, plateNumber: "B 9090 BB", model: "Isuzu Elf", status: "maintenance" },
];

const DEMO_DRIVERS: DispatchDriver[] = [
  { id: 301, name: "Andi Pratama", status: "available" },
  { id: 302, name: "Budi Santoso", status: "available" },
  { id: 303, name: "Citra Lestari", status: "off_duty" },
];

function formatRange(order: DispatchOrder) {
  return `${order.startDate} → ${order.endDate}`;
}

function DraggableOrderCard({ order }: { order: DispatchOrder }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `order:${order.id}` });
  const style: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`rounded-md border bg-card p-3 select-none ${isDragging ? "opacity-60" : ""}`}
      id={`order-${order.id}`}
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">{order.orderNumber}</div>
        <Badge variant={order.status === "active" ? "default" : "secondary"}>{order.status}</Badge>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{order.clientName}</div>
      <div className="mt-2 text-xs">{formatRange(order)}</div>
      <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
        <span>Vehicle: {order.vehicleId ?? "—"}</span>
        <span>Driver: {order.driverId ?? "—"}</span>
      </div>
    </div>
  );
}

function DroppableCard({
  id,
  rootId,
  className,
  children,
}: {
  id: string;
  rootId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      id={rootId}
      className={`${className ?? ""} ${isOver ? "ring-2 ring-primary" : ""}`}
    >
      {children}
    </div>
  );
}

async function saveAssignment(orderId: number, vehicleId: number, driverId: number) {
  const res = await fetch(`/api/orders/${orderId}/assignment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ vehicleId, driverId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Failed to save assignment");
  }
  return res.json();
}

export default function DispatchBoard() {
  const { toast } = useToast();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  // Phase 2 prototype: In demo mode we provide fake data so the board is clickable.
  // In real mode, this page should be wired to API hooks (orders/vehicles/drivers).
  const [orders, setOrders] = useState<DispatchOrder[]>(DEMO_ORDERS);
  const vehicles = useMemo(() => DEMO_VEHICLES, []);
  const drivers = useMemo(() => DEMO_DRIVERS, []);

  const unassignedOrders = orders.filter((o) => !o.vehicleId || !o.driverId);
  const assignedOrders = orders.filter((o) => o.vehicleId && o.driverId);

  const droppableIds = {
    assigned: "droppable:assigned",
  } as const;

  const [activeVehicleId, setActiveVehicleId] = useState<number | null>(null);
  const [activeDriverId, setActiveDriverId] = useState<number | null>(null);

  const availableVehicles = vehicles.filter((v) => v.status === "available");
  const availableDrivers = drivers.filter((d) => d.status === "available");

  function findOrder(id: number) {
    return orders.find((o) => o.id === id);
  }

  async function persist(orderId: number, nextVehicleId: number | null, nextDriverId: number | null) {
    const previous = findOrder(orderId);
    if (!previous) return;

    if (!nextVehicleId || !nextDriverId) {
      toast({
        variant: "destructive",
        title: "Missing assignment",
        description: "Select both a vehicle and a driver before saving.",
      });
      return;
    }

    // Optimistic update
    setOrders((current) =>
      current.map((o) => (o.id === orderId ? { ...o, vehicleId: nextVehicleId, driverId: nextDriverId } : o))
    );

    if (DEMO_MODE) {
      // Demo-only local validation to mimic backend rules for UX/testing.
      const vehicle = nextVehicleId ? vehicles.find((v) => v.id === nextVehicleId) : null;
      const driver = nextDriverId ? drivers.find((d) => d.id === nextDriverId) : null;

      if (vehicle && vehicle.status !== "available") {
        setOrders((current) => current.map((o) => (o.id === orderId ? previous : o)));
        toast({ variant: "destructive", title: "Assignment rejected", description: "Vehicle is not available." });
        return;
      }
      if (driver && driver.status !== "available") {
        setOrders((current) => current.map((o) => (o.id === orderId ? previous : o)));
        toast({ variant: "destructive", title: "Assignment rejected", description: "Driver is not available." });
        return;
      }
      toast({ title: "Dispatch updated", description: "Assignment saved (demo mode)." });
      return;
    }

    try {
      await saveAssignment(orderId, nextVehicleId, nextDriverId);
      toast({ title: "Dispatch updated", description: "Assignment saved." });
    } catch (err: any) {
      // Revert
      setOrders((current) => current.map((o) => (o.id === orderId ? previous : o)));
      toast({ variant: "destructive", title: "Failed to save", description: err?.message || "Please try again." });
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    if (!activeId.startsWith("order:")) return;
    const orderId = Number(activeId.split(":")[1]);
    const order = findOrder(orderId);
    if (!order) return;

    if (overId.startsWith("vehicle:")) {
      const vehicleId = Number(overId.split(":")[1]);
      setActiveVehicleId(vehicleId);
      toast({ title: "Vehicle selected", description: "Now drop the order on a driver, or drop on Assigned to save." });
      return;
    }

    if (overId.startsWith("driver:")) {
      const driverId = Number(overId.split(":")[1]);
      setActiveDriverId(driverId);
      toast({ title: "Driver selected", description: "Drop on Assigned to save, or select a vehicle first." });
      return;
    }

    if (overId === droppableIds.assigned) {
      // Save using currently selected vehicle/driver if set; otherwise keep current.
      const nextVehicleId = activeVehicleId ?? order.vehicleId ?? null;
      const nextDriverId = activeDriverId ?? order.driverId ?? null;
      await persist(orderId, nextVehicleId, nextDriverId);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dispatch Board</h1>
          <p className="text-sm text-muted-foreground">
            Drag orders to select a vehicle/driver, then drop on Assigned to save.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{DEMO_MODE ? "Demo mode" : "Live"}</Badge>
          <Button variant="outline" onClick={() => { setActiveVehicleId(null); setActiveDriverId(null); }}>
            Clear selection
          </Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Orders</CardTitle>
              <CardDescription>Orders missing vehicle or driver</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <SortableContext items={unassignedOrders.map((o) => `order:${o.id}`)} strategy={verticalListSortingStrategy}>
                {unassignedOrders.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No unassigned orders.</div>
                ) : (
                  unassignedOrders.map((o) => (
                    <DraggableOrderCard key={o.id} order={o} />
                  ))
                )}
              </SortableContext>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Vehicles</CardTitle>
              <CardDescription>Drop an order on a vehicle to select it</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableVehicles.length === 0 ? (
                <div className="text-sm text-muted-foreground">No available vehicles.</div>
              ) : (
                availableVehicles.map((v) => (
                  <DroppableCard
                    key={v.id}
                    id={`vehicle:${v.id}`}
                    className={`rounded-md border bg-card p-3 ${activeVehicleId === v.id ? "ring-2 ring-primary" : ""}`}
                  >
                    <button
                      type="button"
                      id={`vehicle-${v.id}`}
                      className="w-full text-left"
                      onClick={() => {
                        setActiveVehicleId(v.id);
                        toast({ title: "Vehicle selected", description: `${v.plateNumber} selected.` });
                      }}
                    >
                      <div className="font-medium">{v.plateNumber}</div>
                      <div className="text-xs text-muted-foreground">{v.model}</div>
                    </button>
                  </DroppableCard>
                ))
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                Selected vehicle: <span className="font-mono">{activeVehicleId ?? "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Drivers</CardTitle>
              <CardDescription>Drop an order on a driver to select them</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {availableDrivers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No available drivers.</div>
              ) : (
                availableDrivers.map((d) => (
                  <DroppableCard
                    key={d.id}
                    id={`driver:${d.id}`}
                    className={`rounded-md border bg-card p-3 ${activeDriverId === d.id ? "ring-2 ring-primary" : ""}`}
                  >
                    <button
                      type="button"
                      id={`driver-${d.id}`}
                      className="w-full text-left"
                      onClick={() => {
                        setActiveDriverId(d.id);
                        toast({ title: "Driver selected", description: `${d.name} selected.` });
                      }}
                    >
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">{d.status}</div>
                    </button>
                  </DroppableCard>
                ))
              )}
              <div className="mt-2 text-xs text-muted-foreground">
                Selected driver: <span className="font-mono">{activeDriverId ?? "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Assigned / Active</CardTitle>
              <CardDescription>Drop here to save assignment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <DroppableCard
                id={droppableIds.assigned}
                rootId="dispatch-dropzone"
                className="rounded-md border border-dashed p-3 text-xs text-muted-foreground"
              >
                <div>Drop an order here to save with selected vehicle & driver.</div>
              </DroppableCard>
              {assignedOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground">No assigned orders yet.</div>
              ) : (
                assignedOrders.map((o) => (
                  <div key={o.id} className="rounded-md border bg-card p-3" id={`assigned-order-${o.id}`}>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{o.orderNumber}</div>
                      <Badge>{o.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{o.clientName}</div>
                    <div className="mt-2 text-xs">
                      Vehicle <span className="font-mono">{o.vehicleId}</span> · Driver{" "}
                      <span className="font-mono">{o.driverId}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </DndContext>
    </div>
  );
}
