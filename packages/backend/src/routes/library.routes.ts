import { Router } from "express";
import {
  getLibraryHandler,
  checkAccessHandler,
  downloadHandler,
} from "../controllers/library.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/", authenticate, getLibraryHandler);
router.get("/:productId/access", authenticate, checkAccessHandler);
router.get("/:productId/download", authenticate, downloadHandler);

export default router;
