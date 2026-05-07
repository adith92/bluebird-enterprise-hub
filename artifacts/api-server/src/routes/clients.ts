import { Router, type IRouter } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import {
  db,
  clientsTable,
  ordersTable,
  invoicesTable,
  vehiclesTable,
  driversTable,
} from "@workspace/db";
import {
  CreateClientBody,
  GetClientParams,
} from "@workspace/api-zod";
import {
  serializeClient,
  serializeOrder,
  serializeInvoice,
} from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/async";

const router: IRouter = Router();

router.get("/clients", requireAuth, asyncHandler(async (_req, res): Promise<void> => {
  const clients = await db.select().from(clientsTable).orderBy(clientsTable.name);

  if (clients.length === 0) {
    res.json([]);
    return;
  }

  const stats = await db
    .select({
      clientId: ordersTable.clientId,
      activeOrders: sql<number>`count(*) FILTER (WHERE ${ordersTable.status} = 'active')::int`,
      totalRevenue: sql<string>`COALESCE(SUM(${ordersTable.price}), 0)::text`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.clientId);

  const statsByClient = new Map(
    stats.map((s) => [s.clientId, s] as const),
  );

  res.json(
    clients.map((c) => {
      const s = statsByClient.get(c.id);
      return serializeClient(
        c,
        s?.activeOrders ?? 0,
        Number(s?.totalRevenue ?? 0),
      );
    }),
  );
}));

router.post("/clients", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const parsed = CreateClientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [client] = await db
    .insert(clientsTable)
    .values(parsed.data)
    .returning();

  if (!client) {
    res.status(500).json({ error: "Failed to create client" });
    return;
  }

  res.status(201).json(serializeClient(client, 0, 0));
}));

router.get("/clients/:id", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = GetClientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, params.data.id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.clientId, client.id))
    .orderBy(ordersTable.createdAt);

  const vehicleIds = Array.from(new Set(orders.map((o) => o.vehicleId)));
  const driverIds = Array.from(new Set(orders.map((o) => o.driverId)));
  const orderIds = orders.map((o) => o.id);

  const [vehicles, drivers, invoices] = await Promise.all([
    vehicleIds.length
      ? db.select().from(vehiclesTable).where(inArray(vehiclesTable.id, vehicleIds))
      : Promise.resolve([]),
    driverIds.length
      ? db.select().from(driversTable).where(inArray(driversTable.id, driverIds))
      : Promise.resolve([]),
    orderIds.length
      ? db.select().from(invoicesTable).where(inArray(invoicesTable.orderId, orderIds))
      : Promise.resolve([]),
  ]);

  const vehicleMap = new Map(vehicles.map((v) => [v.id, v] as const));
  const driverMap = new Map(drivers.map((d) => [d.id, d] as const));
  const orderMap = new Map(orders.map((o) => [o.id, o] as const));

  const activeOrders = orders.filter((o) => o.status === "active").length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.price), 0);

  const apiOrders = orders.map((o) =>
    serializeOrder(
      o,
      client.name,
      vehicleMap.get(o.vehicleId)?.plateNumber ?? "—",
      driverMap.get(o.driverId)?.name ?? "—",
    ),
  );

  const apiInvoices = invoices.map((i) => {
    const ord = orderMap.get(i.orderId);
    return serializeInvoice(
      i,
      ord?.orderNumber ?? "—",
      client.id,
      client.name,
    );
  });

  res.json({
    ...serializeClient(client, activeOrders, totalRevenue),
    orders: apiOrders,
    invoices: apiInvoices,
  });
}));

export default router;
