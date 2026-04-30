import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  db,
  vehiclesTable,
  driversTable,
  ordersTable,
  invoicesTable,
  clientsTable,
} from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [vehicles, drivers, orders, invoices, clientsCount] = await Promise.all([
    db.select().from(vehiclesTable),
    db.select().from(driversTable),
    db.select().from(ordersTable),
    db.select().from(invoicesTable),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(clientsTable),
  ]);

  const total = vehicles.length;
  const available = vehicles.filter((v) => v.status === "available").length;
  const booked = vehicles.filter((v) => v.status === "booked").length;
  const maintenance = vehicles.filter((v) => v.status === "maintenance").length;
  const utilizationPercent = total === 0 ? 0 : Math.round((booked / total) * 100);

  const draft = orders.filter((o) => o.status === "draft").length;
  const active = orders.filter((o) => o.status === "active").length;
  const completed = orders.filter((o) => o.status === "completed").length;
  const cancelled = orders.filter((o) => o.status === "cancelled").length;

  const activeOrdersValue = orders
    .filter((o) => o.status === "active")
    .reduce((s, o) => s + Number(o.price), 0);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const paidThisMonth = invoices
    .filter(
      (i) =>
        i.status === "paid" &&
        i.paidDate &&
        new Date(i.paidDate) >= monthStart,
    )
    .reduce((s, i) => s + Number(i.amount), 0);

  const outstanding = invoices
    .filter((i) => i.status === "outstanding")
    .reduce((s, i) => s + Number(i.amount), 0);

  const projectedThisMonth =
    activeOrdersValue + outstanding + paidThisMonth;

  // Revenue by category
  const catRows = await db
    .select({
      category: vehiclesTable.category,
      revenue: sql<string>`COALESCE(SUM(${ordersTable.price}), 0)::text`,
      orderCount: sql<number>`count(${ordersTable.id})::int`,
    })
    .from(vehiclesTable)
    .leftJoin(ordersTable, eq(ordersTable.vehicleId, vehiclesTable.id))
    .groupBy(vehiclesTable.category)
    .orderBy(vehiclesTable.category);

  const revenueByCategory = catRows.map((r) => ({
    category: r.category,
    revenue: Number(r.revenue),
    orderCount: r.orderCount,
  }));

  // Orders by month (last 6 months)
  const monthRows = await db
    .select({
      month: sql<string>`to_char(date_trunc('month', ${ordersTable.createdAt}), 'YYYY-MM')`,
      orders: sql<number>`count(*)::int`,
      revenue: sql<string>`COALESCE(SUM(${ordersTable.price}), 0)::text`,
    })
    .from(ordersTable)
    .groupBy(sql`date_trunc('month', ${ordersTable.createdAt})`)
    .orderBy(sql`date_trunc('month', ${ordersTable.createdAt})`);

  const ordersByMonth = monthRows.map((r) => ({
    month: r.month,
    orders: r.orders,
    revenue: Number(r.revenue),
  }));

  res.json({
    fleet: { total, available, booked, maintenance, utilizationPercent },
    revenue: {
      activeOrdersValue,
      paidThisMonth,
      outstanding,
      projectedThisMonth,
    },
    orders: { draft, active, completed, cancelled },
    drivers: {
      total: drivers.length,
      available: drivers.filter((d) => d.status === "available").length,
      onTrip: drivers.filter((d) => d.status === "on_trip").length,
      offDuty: drivers.filter((d) => d.status === "off_duty").length,
    },
    clients: { total: clientsCount[0]?.c ?? 0 },
    revenueByCategory,
    ordersByMonth,
  });
});

router.get("/dashboard/maintenance-alerts", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.status, "maintenance"));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const alerts = rows
    .filter((v) => v.maintenanceCompletionDate)
    .map((v) => {
      const completion = new Date(v.maintenanceCompletionDate as string);
      const days = Math.floor(
        (completion.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      let severity: "overdue" | "urgent" | "upcoming" = "upcoming";
      if (days < 0) severity = "overdue";
      else if (days <= 3) severity = "urgent";
      return {
        vehicleId: v.id,
        plateNumber: v.plateNumber,
        model: v.model,
        category: v.category,
        maintenanceCompletionDate: v.maintenanceCompletionDate as string,
        daysRemaining: days,
        severity,
        note: v.maintenanceNote ?? null,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining);

  res.json(alerts);
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const recentOrders = await db
    .select({
      o: ordersTable,
      clientName: clientsTable.name,
    })
    .from(ordersTable)
    .leftJoin(clientsTable, eq(clientsTable.id, ordersTable.clientId))
    .orderBy(desc(ordersTable.createdAt))
    .limit(8);

  const recentInvoices = await db
    .select({
      i: invoicesTable,
      orderNumber: ordersTable.orderNumber,
      clientName: clientsTable.name,
    })
    .from(invoicesTable)
    .leftJoin(ordersTable, eq(ordersTable.id, invoicesTable.orderId))
    .leftJoin(clientsTable, eq(clientsTable.id, ordersTable.clientId))
    .where(eq(invoicesTable.status, "paid"))
    .orderBy(desc(invoicesTable.paidDate))
    .limit(5);

  const recentMaintenance = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.status, "maintenance"))
    .limit(5);

  type Item = {
    id: string;
    type:
      | "order_created"
      | "order_completed"
      | "invoice_paid"
      | "vehicle_maintenance";
    title: string;
    subtitle: string;
    entityId: number;
    timestamp: string;
  };

  const items: Item[] = [];

  for (const r of recentOrders) {
    if (r.o.status === "completed") {
      items.push({
        id: `order-completed-${r.o.id}`,
        type: "order_completed",
        title: `Order ${r.o.orderNumber} completed`,
        subtitle: `Client: ${r.clientName ?? "—"}`,
        entityId: r.o.id,
        timestamp: r.o.createdAt.toISOString(),
      });
    } else {
      items.push({
        id: `order-created-${r.o.id}`,
        type: "order_created",
        title: `Order ${r.o.orderNumber} created`,
        subtitle: `Client: ${r.clientName ?? "—"}`,
        entityId: r.o.id,
        timestamp: r.o.createdAt.toISOString(),
      });
    }
  }

  for (const r of recentInvoices) {
    items.push({
      id: `invoice-paid-${r.i.id}`,
      type: "invoice_paid",
      title: `Invoice ${r.i.invoiceNumber} paid`,
      subtitle: `${r.clientName ?? "—"} · ${Number(r.i.amount).toLocaleString("en-US", { style: "currency", currency: "IDR", maximumFractionDigits: 0 })}`,
      entityId: r.i.id,
      timestamp: (r.i.paidDate ? new Date(r.i.paidDate) : new Date()).toISOString(),
    });
  }

  for (const v of recentMaintenance) {
    items.push({
      id: `maintenance-${v.id}`,
      type: "vehicle_maintenance",
      title: `${v.plateNumber} entered maintenance`,
      subtitle: `${v.category} · ${v.model}`,
      entityId: v.id,
      timestamp: v.createdAt.toISOString(),
    });
  }

  items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  res.json(items.slice(0, 12));
});

// Suppress unused-var warnings
void and;

export default router;
