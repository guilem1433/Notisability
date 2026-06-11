import { Router } from "express";
import { getLibraryHandler } from "../controllers/library.controller";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.get("/", authenticate, getLibraryHandler);

export default router;
