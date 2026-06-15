import { Router } from "express";
import { listCategoriesHandler } from "../controllers/category.controller";

const router = Router();

router.get("/", listCategoriesHandler);

export default router;
