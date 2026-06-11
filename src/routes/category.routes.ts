import { Router } from "express";
import { RoleName } from "@prisma/client";
import {
  listCategoriesHandler,
  getCategoryHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from "../controllers/category.controller";
import { authenticate, authorize } from "../middlewares/auth";

const router = Router();

router.get("/", listCategoriesHandler);
router.get("/:id", getCategoryHandler);
router.post("/", authenticate, authorize(RoleName.ADMIN), createCategoryHandler);
router.put("/:id", authenticate, authorize(RoleName.ADMIN), updateCategoryHandler);
router.delete("/:id", authenticate, authorize(RoleName.ADMIN), deleteCategoryHandler);

export default router;
