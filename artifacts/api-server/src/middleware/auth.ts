import { type Request, type Response, type NextFunction } from "express";

export type UserRole = "gm" | "sales" | "operations" | "finance";

export type AuthedRequest = Request & {
  session: {
    userId?: number;
    role?: UserRole;
  };
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = (req as AuthedRequest).session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
}

export function requireRole(allowed: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as AuthedRequest).session?.role;
    if (!role) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    if (!allowed.includes(role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}

