import { Router, type IRouter } from "express";
import { eq, and, ne, sql, notInArray, inArray } from "drizzle-orm";
import {
  db,
  vehiclesTable,
  ordersTable,
  clientsTable,
  driversTable,
} from "@workspace/db";
import {
  CreateVehicleBody,
  GetVehicleParams,
  ListVehiclesQueryParams,
  ListAvailableVehiclesQueryParams,
  UpdateVehicleStatusParams,
  UpdateVehicleStatusBody,
} from "@workspace/api-zod";
import { serializeVehicle, serializeOrder } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/async";

const router: IRouter = Router();

router.get("/vehicles", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = ListVehiclesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const where = params.data.status
    ? eq(vehiclesTable.status, params.data.status)
    : undefined;

  const rows = await db
    .select()
    .from(vehiclesTable)
    .where(where)
    .orderBy(vehiclesTable.plateNumber);

  res.json(rows.map(serializeVehicle));
}));

router.post("/vehicles", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const parsed = CreateVehicleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [v] = await db
    .insert(vehiclesTable)
    .values({
      ...parsed.data,
      dailyRate: String(parsed.data.dailyRate),
    })
    .returning();

  if (!v) {
    res.status(500).json({ error: "Failed to create vehicle" });
    return;
  }

  res.status(201).json(serializeVehicle(v));
}));

router.get("/vehicles/available", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  // Coerce date strings before zod validation since the generated schema uses zod.date()
  const coerced = {
    ...req.query,
    startDate:
      typeof req.query.startDate === "string"
        ? new Date(req.query.startDate)
        : req.query.startDate,
    endDate:
      typeof req.query.endDate === "string"
        ? new Date(req.query.endDate)
        : req.query.endDate,
  };
  const params = ListAvailableVehiclesQueryParams.safeParse(coerced);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const { startDate, endDate, category } = params.data;
  const start =
    startDate instanceof Date ? startDate.toISOString().slice(0, 10) : startDate;
  const end =
    endDate instanceof Date ? endDate.toISOString().slice(0, 10) : endDate;

  // Find vehicles with overlapping non-cancelled orders
  const conflicting = await db
    .select({ vehicleId: ordersTable.vehicleId })
    .from(ordersTable)
    .where(
      and(
        ne(ordersTable.status, "cancelled"),
        sql`${ordersTable.startDate} <= ${end}`,
        sql`${ordersTable.endDate} >= ${start}`,
      ),
    );

  const blockedIds = Array.from(new Set(conflicting.map((c) => c.vehicleId)));

  const conditions = [ne(vehiclesTable.status, "maintenance")];
  if (blockedIds.length) {
    conditions.push(notInArray(vehiclesTable.id, blockedIds));
  }
  if (category) {
    conditions.push(eq(vehiclesTable.category, category));
  }

  const rows = await db
    .select()
    .from(vehiclesTable)
    .where(and(...conditions))
    .orderBy(vehiclesTable.plateNumber);

  res.json(rows.map(serializeVehicle));
}));

router.get("/vehicles/:id", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = GetVehicleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [v] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.id, params.data.id));

  if (!v) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.vehicleId, v.id))
    .orderBy(ordersTable.createdAt);

  const clientIds = Array.from(new Set(orders.map((o) => o.clientId)));
  const driverIds = Array.from(new Set(orders.map((o) => o.driverId)));

  const [clients, drivers] = await Promise.all([
    clientIds.length
      ? db.select().from(clientsTable).where(inArray(clientsTable.id, clientIds))
      : Promise.resolve([]),
    driverIds.length
      ? db.select().from(driversTable).where(inArray(driversTable.id, driverIds))
      : Promise.resolve([]),
  ]);
  const cmap = new Map(clients.map((c) => [c.id, c] as const));
  const dmap = new Map(drivers.map((d) => [d.id, d] as const));

  res.json({
    ...serializeVehicle(v),
    orders: orders.map((o) =>
      serializeOrder(
        o,
        cmap.get(o.clientId)?.name ?? "—",
        v.plateNumber,
        dmap.get(o.driverId)?.name ?? "—",
      ),
    ),
  });
}));

router.patch("/vehicles/:id", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = UpdateVehicleStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVehicleStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (
    parsed.data.status === "maintenance" &&
    !parsed.data.maintenanceCompletionDate
  ) {
    res.status(400).json({
      error: "maintenanceCompletionDate is required when status is maintenance",
    });
    return;
  }

  const completion =
    parsed.data.maintenanceCompletionDate instanceof Date
      ? parsed.data.maintenanceCompletionDate.toISOString().slice(0, 10)
      : parsed.data.maintenanceCompletionDate ?? null;

  const [v] = await db
    .update(vehiclesTable)
    .set({
      status: parsed.data.status,
      maintenanceCompletionDate:
        parsed.data.status === "maintenance" ? completion : null,
      maintenanceNote:
        parsed.data.status === "maintenance"
          ? parsed.data.maintenanceNote ?? null
          : null,
    })
    .where(eq(vehiclesTable.id, params.data.id))
    .returning();

  if (!v) {
    res.status(404).json({ error: "Vehicle not found" });
    return;
  }

  res.json(serializeVehicle(v));
}));

export default router;
