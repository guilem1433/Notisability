import { Router } from "express";
import {
  createOrderHandler,
  getOrderHandler,
  listMyOrdersHandler,
  webhookHandler,
} from "../controllers/order.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/webhook", webhookHandler);
router.post("/", authenticate, createOrderHandler);
router.get("/me", authenticate, listMyOrdersHandler);
router.get("/:id", authenticate, getOrderHandler);

export default router;
