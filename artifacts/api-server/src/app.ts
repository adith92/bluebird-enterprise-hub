import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// When deployed behind a proxy (Vercel/Render/Railway), this allows secure cookies
// and correct IP/HTTPS detection. Keep it enabled in production.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  // Basic hardening: avoid advertising server internals
  req.res?.removeHeader("X-Powered-By");
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "bluebird-dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "lax" : "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    },
  }),
);

app.use("/api", router);

export default app;
