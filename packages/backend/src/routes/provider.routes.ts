import { Router } from "express";
import { RoleName } from "@prisma/client";
import {
  listMyProductsHandler,
  getMyProductHandler,
  createMyProductHandler,
  updateMyProductHandler,
  uploadProductFileHandler,
} from "../controllers/provider.controller";
import { authenticate, authorize } from "../middlewares/auth";
import { uploadProductFile } from "../middlewares/upload";

const router = Router();

router.use(authenticate, authorize(RoleName.PROVIDER, RoleName.ADMIN));

router.get("/products", listMyProductsHandler);
router.get("/products/:id", getMyProductHandler);
router.post("/products", createMyProductHandler);
router.patch("/products/:id", updateMyProductHandler);
router.post("/products/:productId/files", uploadProductFile.single("file"), uploadProductFileHandler);

export default router;
