import { Router, type IRouter } from "express";
import { ilike, or, eq } from "drizzle-orm";
import {
  db,
  clientsTable,
  vehiclesTable,
  driversTable,
  ordersTable,
} from "@workspace/db";
import { GlobalSearchQueryParams } from "@workspace/api-zod";
import {
  serializeClient,
  serializeVehicle,
  serializeDriver,
  serializeOrder,
} from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/async";

const router: IRouter = Router();

router.get("/search", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = GlobalSearchQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const q = params.data.q.trim();
  if (!q) {
    res.json({ orders: [], vehicles: [], clients: [], drivers: [] });
    return;
  }
  const like = `%${q}%`;

  const [clients, vehicles, drivers, orderRows] = await Promise.all([
    db
      .select()
      .from(clientsTable)
      .where(
        or(
          ilike(clientsTable.name, like),
          ilike(clientsTable.code, like),
          ilike(clientsTable.industry, like),
        ),
      )
      .limit(8),
    db
      .select()
      .from(vehiclesTable)
      .where(
        or(
          ilike(vehiclesTable.plateNumber, like),
          ilike(vehiclesTable.model, like),
          ilike(vehiclesTable.category, like),
        ),
      )
      .limit(8),
    db
      .select()
      .from(driversTable)
      .where(
        or(
          ilike(driversTable.name, like),
          ilike(driversTable.licenseNumber, like),
        ),
      )
      .limit(8),
    db
      .select({
        o: ordersTable,
        clientName: clientsTable.name,
        vehiclePlate: vehiclesTable.plateNumber,
        driverName: driversTable.name,
      })
      .from(ordersTable)
      .leftJoin(clientsTable, eq(clientsTable.id, ordersTable.clientId))
      .leftJoin(vehiclesTable, eq(vehiclesTable.id, ordersTable.vehicleId))
      .leftJoin(driversTable, eq(driversTable.id, ordersTable.driverId))
      .where(
        or(
          ilike(ordersTable.orderNumber, like),
          ilike(ordersTable.pickupLocation, like),
          ilike(ordersTable.dropoffLocation, like),
          ilike(clientsTable.name, like),
          ilike(vehiclesTable.plateNumber, like),
        ),
      )
      .limit(8),
  ]);

  res.json({
    orders: orderRows.map((r) =>
      serializeOrder(
        r.o,
        r.clientName ?? "—",
        r.vehiclePlate ?? "—",
        r.driverName ?? "—",
      ),
    ),
    vehicles: vehicles.map(serializeVehicle),
    clients: clients.map((c) => serializeClient(c, 0, 0)),
    drivers: drivers.map(serializeDriver),
  });
}));

export default router;
