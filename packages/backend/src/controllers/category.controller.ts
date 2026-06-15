import { Request, Response } from "express";
import * as categoryService from "../services/category.service";

export async function listCategoriesHandler(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.listCategories();
  res.status(200).json(categories);
}
