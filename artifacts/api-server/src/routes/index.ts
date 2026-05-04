import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import clientsRouter from "./clients";
import vehiclesRouter from "./vehicles";
import driversRouter from "./drivers";
import ordersRouter from "./orders";
import invoicesRouter from "./invoices";
import dashboardRouter from "./dashboard";
import searchRouter from "./search";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(clientsRouter);
router.use(vehiclesRouter);
router.use(driversRouter);
router.use(ordersRouter);
router.use(invoicesRouter);
router.use(dashboardRouter);
router.use(searchRouter);

export default router;
