import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  date,
  timestamp,
} from "drizzle-orm/pg-core";
import { clientsTable } from "./clients";
import { vehiclesTable } from "./vehicles";
import { driversTable } from "./drivers";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  clientId: integer("client_id")
    .notNull()
    .references(() => clientsTable.id),
  vehicleId: integer("vehicle_id")
    .notNull()
    .references(() => vehiclesTable.id),
  driverId: integer("driver_id")
    .notNull()
    .references(() => driversTable.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  pickupLocation: text("pickup_location").notNull(),
  dropoffLocation: text("dropoff_location").notNull(),
  price: numeric("price", { precision: 14, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Order = typeof ordersTable.$inferSelect;
export type InsertOrder = typeof ordersTable.$inferInsert;
