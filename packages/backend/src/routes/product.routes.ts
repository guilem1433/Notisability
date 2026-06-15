import { Router } from "express";
import { RoleName } from "@prisma/client";
import {
  listProductsHandler,
  getProductHandler,
  getProductBySlugHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from "../controllers/product.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.get("/", listProductsHandler);
router.get("/slug/:slug", getProductBySlugHandler);
router.get("/:id", getProductHandler);

router.post("/", authenticate, authorize(RoleName.PROVIDER, RoleName.ADMIN), createProductHandler);
router.patch("/:id", authenticate, authorize(RoleName.PROVIDER, RoleName.ADMIN), updateProductHandler);
router.delete("/:id", authenticate, authorize(RoleName.PROVIDER, RoleName.ADMIN), deleteProductHandler);

export default router;
