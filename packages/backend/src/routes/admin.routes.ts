import { Router } from "express";
import { RoleName } from "@prisma/client";
import {
  listUsersHandler,
  listRolesHandler,
  updateUserRoleHandler,
  listAllProductsHandler,
  updateProductStatusHandler,
} from "../controllers/admin.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.use(authenticate, authorize(RoleName.ADMIN));

router.get("/users", listUsersHandler);
router.get("/roles", listRolesHandler);
router.patch("/users/:userId/role", updateUserRoleHandler);
router.get("/products", listAllProductsHandler);
router.patch("/products/:productId/status", updateProductStatusHandler);

export default router;
