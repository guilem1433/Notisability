import { Request, Response } from "express";
import * as categoryService from "../services/category.service";
import { AppError } from "../utils/AppError";

export async function listCategoriesHandler(_req: Request, res: Response): Promise<void> {
  const categories = await categoryService.listCategories();
  res.status(200).json({ categories });
}

export async function getCategoryHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError("El id de la categoría debe ser numérico", 400);
  }

  const category = await categoryService.getCategoryById(id);
  res.status(200).json({ category });
}

export async function createCategoryHandler(req: Request, res: Response): Promise<void> {
  const { name, description } = req.body;
  const category = await categoryService.createCategory({ name, description });
  res.status(201).json({ category });
}

export async function updateCategoryHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError("El id de la categoría debe ser numérico", 400);
  }

  const { name, description } = req.body;
  const category = await categoryService.updateCategory(id, { name, description });
  res.status(200).json({ category });
}

export async function deleteCategoryHandler(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);

  if (Number.isNaN(id)) {
    throw new AppError("El id de la categoría debe ser numérico", 400);
  }

  await categoryService.deleteCategory(id);
  res.status(204).send();
}
