import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  invoicesTable,
  ordersTable,
  clientsTable,
  vehiclesTable,
  driversTable,
} from "@workspace/db";
import {
  GetInvoiceParams,
  ListInvoicesQueryParams,
  UpdateInvoiceStatusParams,
  UpdateInvoiceStatusBody,
} from "@workspace/api-zod";
import { serializeInvoice, serializeOrder } from "../lib/serialize";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../middleware/async";

const router: IRouter = Router();

router.get("/invoices", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = ListInvoicesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const where = params.data.status
    ? eq(invoicesTable.status, params.data.status)
    : undefined;

  const rows = await db
    .select({
      i: invoicesTable,
      orderNumber: ordersTable.orderNumber,
      clientId: clientsTable.id,
      clientName: clientsTable.name,
    })
    .from(invoicesTable)
    .leftJoin(ordersTable, eq(ordersTable.id, invoicesTable.orderId))
    .leftJoin(clientsTable, eq(clientsTable.id, ordersTable.clientId))
    .where(where)
    .orderBy(desc(invoicesTable.issuedDate));

  res.json(
    rows.map((r) =>
      serializeInvoice(
        r.i,
        r.orderNumber ?? "—",
        r.clientId ?? 0,
        r.clientName ?? "—",
      ),
    ),
  );
}));

router.get("/invoices/:id", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = GetInvoiceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select({
      i: invoicesTable,
      o: ordersTable,
      clientName: clientsTable.name,
      clientId: clientsTable.id,
      vehiclePlate: vehiclesTable.plateNumber,
      driverName: driversTable.name,
    })
    .from(invoicesTable)
    .leftJoin(ordersTable, eq(ordersTable.id, invoicesTable.orderId))
    .leftJoin(clientsTable, eq(clientsTable.id, ordersTable.clientId))
    .leftJoin(vehiclesTable, eq(vehiclesTable.id, ordersTable.vehicleId))
    .leftJoin(driversTable, eq(driversTable.id, ordersTable.driverId))
    .where(eq(invoicesTable.id, params.data.id));

  if (!row || !row.o) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  res.json({
    ...serializeInvoice(
      row.i,
      row.o.orderNumber,
      row.clientId ?? 0,
      row.clientName ?? "—",
    ),
    order: serializeOrder(
      row.o,
      row.clientName ?? "—",
      row.vehiclePlate ?? "—",
      row.driverName ?? "—",
    ),
  });
}));

router.patch("/invoices/:id", requireAuth, asyncHandler(async (req, res): Promise<void> => {
  const params = UpdateInvoiceStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateInvoiceStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const paidDate =
    parsed.data.status === "paid"
      ? new Date().toISOString().slice(0, 10)
      : null;

  const [inv] = await db
    .update(invoicesTable)
    .set({
      status: parsed.data.status,
      paidDate,
    })
    .where(eq(invoicesTable.id, params.data.id))
    .returning();

  if (!inv) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(eq(ordersTable.id, inv.orderId));
  const [client] = order
    ? await db
        .select()
        .from(clientsTable)
        .where(eq(clientsTable.id, order.clientId))
    : [];

  res.json(
    serializeInvoice(
      inv,
      order?.orderNumber ?? "—",
      client?.id ?? 0,
      client?.name ?? "—",
    ),
  );
}));

export default router;
