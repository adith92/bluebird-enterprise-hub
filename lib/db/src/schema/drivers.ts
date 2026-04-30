import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

export const driversTable = pgTable("drivers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  licenseNumber: text("license_number").notNull().unique(),
  phone: text("phone").notNull(),
  status: text("status").notNull().default("available"),
  rating: numeric("rating", { precision: 3, scale: 2 }).notNull().default("5.00"),
  yearsOfService: integer("years_of_service").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Driver = typeof driversTable.$inferSelect;
export type InsertDriver = typeof driversTable.$inferInsert;
