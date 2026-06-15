import { Router } from "express";
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  meHandler,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/register", registerHandler);
router.post("/login", loginHandler);
router.post("/refresh", refreshHandler);
router.get("/me", authenticate, meHandler);

export default router;
