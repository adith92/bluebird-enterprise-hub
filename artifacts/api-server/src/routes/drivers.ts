import { Router, type IRouter } from "express";
import { eq, inArray } from "drizzle-orm";
import {
  db,
  driversTable,
  ordersTable,
  clientsTable,
  vehiclesTable,
} from "@workspace/db";
import {
  CreateDriverBody,
  GetDriverParams,
} from "@workspace/api-zod";
import { serializeDriver, serializeOrder } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/async";

const router: IRouter = Router();

router.get("/drivers", requireAuth, asyncHandler(async (_req, res): Promise<void> => {
  const rows = await db.select().from(driversTable).orderBy(driversTable.name);
  res.json(rows.map(serializeDriver));
}));

router.post("/drivers", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const parsed = CreateDriverBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [d] = await db.insert(driversTable).values(parsed.data).returning();
  if (!d) {
    res.status(500).json({ error: "Failed to create driver" });
    return;
  }

  res.status(201).json(serializeDriver(d));
}));

router.get("/drivers/:id", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = GetDriverParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [d] = await db
    .select()
    .from(driversTable)
    .where(eq(driversTable.id, params.data.id));

  if (!d) {
    res.status(404).json({ error: "Driver not found" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.driverId, d.id))
    .orderBy(ordersTable.createdAt);

  const clientIds = Array.from(new Set(orders.map((o) => o.clientId)));
  const vehicleIds = Array.from(new Set(orders.map((o) => o.vehicleId)));

  const [clients, vehicles] = await Promise.all([
    clientIds.length
      ? db.select().from(clientsTable).where(inArray(clientsTable.id, clientIds))
      : Promise.resolve([]),
    vehicleIds.length
      ? db.select().from(vehiclesTable).where(inArray(vehiclesTable.id, vehicleIds))
      : Promise.resolve([]),
  ]);
  const cmap = new Map(clients.map((c) => [c.id, c] as const));
  const vmap = new Map(vehicles.map((v) => [v.id, v] as const));

  res.json({
    ...serializeDriver(d),
    orders: orders.map((o) =>
      serializeOrder(
        o,
        cmap.get(o.clientId)?.name ?? "—",
        vmap.get(o.vehicleId)?.plateNumber ?? "—",
        d.name,
      ),
    ),
  });
}));

export default router;
