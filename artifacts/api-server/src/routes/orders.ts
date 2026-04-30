import { Router, type IRouter } from "express";
import { eq, and, ne, sql, inArray, desc } from "drizzle-orm";
import {
  db,
  ordersTable,
  clientsTable,
  vehiclesTable,
  driversTable,
  invoicesTable,
} from "@workspace/db";
import {
  CreateOrderBody,
  GetOrderParams,
  ListOrdersQueryParams,
  UpdateOrderStatusParams,
  UpdateOrderStatusBody,
} from "@workspace/api-zod";
import { serializeOrder, serializeInvoice } from "../lib/serialize";

const router: IRouter = Router();

async function nextOrderNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(ordersTable);
  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `BB-${year}-${seq}`;
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoicesTable);
  const seq = String((count ?? 0) + 1).padStart(4, "0");
  return `INV-${year}-${seq}`;
}

router.get("/orders", async (req, res): Promise<void> => {
  const params = ListOrdersQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const where = params.data.status
    ? eq(ordersTable.status, params.data.status)
    : undefined;

  const rows = await db
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
    .where(where)
    .orderBy(desc(ordersTable.createdAt));

  res.json(
    rows.map((r) =>
      serializeOrder(
        r.o,
        r.clientName ?? "—",
        r.vehiclePlate ?? "—",
        r.driverName ?? "—",
      ),
    ),
  );
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const start =
    parsed.data.startDate instanceof Date
      ? parsed.data.startDate.toISOString().slice(0, 10)
      : parsed.data.startDate;
  const end =
    parsed.data.endDate instanceof Date
      ? parsed.data.endDate.toISOString().slice(0, 10)
      : parsed.data.endDate;

  // Availability check: vehicle must not have overlapping non-cancelled orders
  const conflict = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(
      and(
        eq(ordersTable.vehicleId, parsed.data.vehicleId),
        ne(ordersTable.status, "cancelled"),
        sql`${ordersTable.startDate} <= ${end}`,
        sql`${ordersTable.endDate} >= ${start}`,
      ),
    );

  if (conflict.length > 0) {
    res.status(409).json({
      error: "Vehicle is already booked during the selected dates",
    });
    return;
  }

  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.id, parsed.data.vehicleId));

  if (!vehicle) {
    res.status(400).json({ error: "Vehicle not found" });
    return;
  }
  if (vehicle.status === "maintenance") {
    res.status(409).json({ error: "Vehicle is under maintenance" });
    return;
  }

  const orderNumber = await nextOrderNumber();

  const [order] = await db
    .insert(ordersTable)
    .values({
      orderNumber,
      clientId: parsed.data.clientId,
      vehicleId: parsed.data.vehicleId,
      driverId: parsed.data.driverId,
      startDate: start,
      endDate: end,
      pickupLocation: parsed.data.pickupLocation,
      dropoffLocation: parsed.data.dropoffLocation,
      price: String(parsed.data.price),
      notes: parsed.data.notes ?? null,
      status: "draft",
    })
    .returning();

  if (!order) {
    res.status(500).json({ error: "Failed to create order" });
    return;
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, order.clientId));
  const [driver] = await db
    .select()
    .from(driversTable)
    .where(eq(driversTable.id, order.driverId));

  res
    .status(201)
    .json(
      serializeOrder(
        order,
        client?.name ?? "—",
        vehicle.plateNumber,
        driver?.name ?? "—",
      ),
    );
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      o: ordersTable,
      clientName: clientsTable.name,
      vehiclePlate: vehiclesTable.plateNumber,
      driverName: driversTable.name,
      clientId: clientsTable.id,
    })
    .from(ordersTable)
    .leftJoin(clientsTable, eq(clientsTable.id, ordersTable.clientId))
    .leftJoin(vehiclesTable, eq(vehiclesTable.id, ordersTable.vehicleId))
    .leftJoin(driversTable, eq(driversTable.id, ordersTable.driverId))
    .where(eq(ordersTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const [invoice] = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.orderId, row.o.id));

  const apiOrder = serializeOrder(
    row.o,
    row.clientName ?? "—",
    row.vehiclePlate ?? "—",
    row.driverName ?? "—",
  );

  res.json({
    ...apiOrder,
    invoice: invoice
      ? serializeInvoice(
          invoice,
          row.o.orderNumber,
          row.o.clientId,
          row.clientName ?? "—",
        )
      : null,
  });
});

router.patch("/orders/:id", async (req, res): Promise<void> => {
  const params = UpdateOrderStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateOrderStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [order] = await db
    .update(ordersTable)
    .set({ status: parsed.data.status })
    .where(eq(ordersTable.id, params.data.id))
    .returning();

  if (!order) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  // Sync vehicle status with order status
  if (parsed.data.status === "active") {
    await db
      .update(vehiclesTable)
      .set({ status: "booked" })
      .where(eq(vehiclesTable.id, order.vehicleId));
    await db
      .update(driversTable)
      .set({ status: "on_trip" })
      .where(eq(driversTable.id, order.driverId));
  } else if (parsed.data.status === "completed") {
    // Free up vehicle/driver if no other active orders
    const otherActive = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.vehicleId, order.vehicleId),
          eq(ordersTable.status, "active"),
        ),
      );
    if (otherActive.length === 0) {
      await db
        .update(vehiclesTable)
        .set({ status: "available" })
        .where(eq(vehiclesTable.id, order.vehicleId));
    }
    const otherActiveDriver = await db
      .select({ id: ordersTable.id })
      .from(ordersTable)
      .where(
        and(
          eq(ordersTable.driverId, order.driverId),
          eq(ordersTable.status, "active"),
        ),
      );
    if (otherActiveDriver.length === 0) {
      await db
        .update(driversTable)
        .set({ status: "available" })
        .where(eq(driversTable.id, order.driverId));
    }

    // Generate invoice on completion if not exists
    const existing = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.orderId, order.id));
    if (existing.length === 0) {
      const issued = new Date();
      const due = new Date();
      due.setDate(due.getDate() + 30);
      await db.insert(invoicesTable).values({
        invoiceNumber: await nextInvoiceNumber(),
        orderId: order.id,
        amount: order.price,
        status: "outstanding",
        issuedDate: issued.toISOString().slice(0, 10),
        dueDate: due.toISOString().slice(0, 10),
      });
    }
  }

  const [client] = await db
    .select()
    .from(clientsTable)
    .where(eq(clientsTable.id, order.clientId));
  const [vehicle] = await db
    .select()
    .from(vehiclesTable)
    .where(eq(vehiclesTable.id, order.vehicleId));
  const [driver] = await db
    .select()
    .from(driversTable)
    .where(eq(driversTable.id, order.driverId));

  res.json(
    serializeOrder(
      order,
      client?.name ?? "—",
      vehicle?.plateNumber ?? "—",
      driver?.name ?? "—",
    ),
  );
});

// Suppress unused-var warning when inArray isn't used here
void inArray;

export default router;
