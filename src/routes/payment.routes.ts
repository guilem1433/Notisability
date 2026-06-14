import { Router } from "express";
import { checkoutHandler, webhookHandler } from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/checkout", authenticate, checkoutHandler);
router.post("/webhook", webhookHandler);

export default router;
