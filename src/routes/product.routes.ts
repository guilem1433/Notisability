import { Router } from "express";
import { RoleName } from "@prisma/client";
import {
  listProductsHandler,
  getProductHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from "../controllers/product.controller";
import { authenticate, authorize, optionalAuthenticate } from "../middlewares/auth";
import { uploadProductAssets } from "../middlewares/upload";

const router = Router();

router.get("/", listProductsHandler);
router.get("/:id", optionalAuthenticate, getProductHandler);

router.post(
  "/",
  authenticate,
  authorize(RoleName.DEVELOPER, RoleName.ADMIN),
  uploadProductAssets,
  createProductHandler
);

router.put(
  "/:id",
  authenticate,
  authorize(RoleName.DEVELOPER, RoleName.ADMIN),
  uploadProductAssets,
  updateProductHandler
);

router.delete(
  "/:id",
  authenticate,
  authorize(RoleName.DEVELOPER, RoleName.ADMIN),
  deleteProductHandler
);

export default router;
