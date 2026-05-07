import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { verifyGoogleIdToken } from "../lib/google-auth";

function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

const router: IRouter = Router();

router.post("/auth/login", async (req, res): Promise<void> => {
  const { username, password } = req.body as { username?: string; password?: string };

  if (!username || !password) {
    res.status(400).json({ error: "Username and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, normalizeUsername(username)))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  (req.session as any).userId = user.id;
  (req.session as any).role = user.role;

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });
});

router.post("/auth/google", async (req, res): Promise<void> => {
  const { idToken } = req.body as { idToken?: string };
  if (!idToken) {
    res.status(400).json({ error: "idToken is required" });
    return;
  }

  try {
    const payload = await verifyGoogleIdToken(idToken);
    const email = payload.email;
    if (!email) {
      res.status(401).json({ error: "Google account email is required" });
      return;
    }

    const username = normalizeUsername(email.split("@")[0] || email);
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);

    const user =
      existing ??
      (
        await db
          .insert(usersTable)
          .values({
            username,
            displayName: payload.name || email,
            role: "gm",
            passwordHash: await bcrypt.hash(`google:${payload.sub}:${Date.now()}`, 10),
          })
          .returning()
      )[0];

    (req.session as any).userId = user.id;
    (req.session as any).role = user.role;

    res.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
  } catch (err: any) {
    res.status(401).json({ error: err?.message || "Google login failed" });
  }
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = (req.session as any).userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });
});

export default router;
