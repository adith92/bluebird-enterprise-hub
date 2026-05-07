import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { logger } from "./logger";

const DEMO_USERS = [
  { username: "gm",         displayName: "General Manager",  role: "gm"         as const, password: "bluebird" },
  { username: "sales",      displayName: "Sales Team",       role: "sales"      as const, password: "bluebird" },
  { username: "operations", displayName: "Operations Team",  role: "operations" as const, password: "bluebird" },
  { username: "finance",    displayName: "Finance Team",     role: "finance"    as const, password: "bluebird" },
  {
    username: (process.env.DEMO_ADMIN_USERNAME || "admin").trim().toLowerCase(),
    displayName: "Demo Admin",
    role: "gm" as const,
    password: process.env.DEMO_ADMIN_PASSWORD || "admin",
  },
];

export async function ensureDemoUsers(): Promise<void> {
  try {
    const existing = await db.select().from(usersTable).limit(1);
    if (existing.length > 0) return;

    logger.info("Seeding demo users...");

    const rows = await Promise.all(
      DEMO_USERS.map(async (u) => ({
        username: u.username,
        displayName: u.displayName,
        role: u.role,
        passwordHash: await bcrypt.hash(u.password, 10),
      }))
    );

    await db.insert(usersTable).values(rows);
    logger.info({ count: rows.length }, "Demo users seeded");
  } catch (err) {
    logger.error({ err }, "Failed to seed demo users");
  }
}
