import { Request, Response } from "express";
import * as productService from "../services/product.service";
import { AppError } from "../utils/AppError";
import { relativeUploadPath } from "../middlewares/upload";

function parseId(value: unknown): number {
  const id = Number(value);

  if (Number.isNaN(id)) {
    throw new AppError("El id del producto debe ser numérico", 400);
  }

  return id;
}

function getUploadedFiles(req: Request): {
  imageUrl?: string;
  fileUrl?: string;
} {
  const files = req.files as { [field: string]: Express.Multer.File[] } | undefined;
  const result: { imageUrl?: string; fileUrl?: string } = {};

  const image = files?.image?.[0];
  if (image) {
    result.imageUrl = relativeUploadPath(image, "images");
  }

  const file = files?.file?.[0];
  if (file) {
    result.fileUrl = relativeUploadPath(file, "files");
  }

  return result;
}

export async function listProductsHandler(req: Request, res: Response): Promise<void> {
  const { categoryId, search, minPrice, maxPrice, sort, page, limit } = req.query;

  const result = await productService.listProducts({
    categoryId: categoryId ? Number(categoryId) : undefined,
    search: typeof search === "string" ? search : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    sort: sort === "price_asc" || sort === "price_desc" || sort === "newest" ? sort : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  res.status(200).json(result);
}

export async function getProductHandler(req: Request, res: Response): Promise<void> {
  const id = parseId(req.params.id);

  const product = await productService.getProductById(id, req.user?.userId, req.user?.roleName);

  res.status(200).json({ product });
}

export async function createProductHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const { title, description, price, categoryId } = req.body;
  const uploaded = getUploadedFiles(req);

  const product = await productService.createProduct(req.user.userId, {
    title,
    description,
    price: price !== undefined ? Number(price) : undefined,
    categoryId: categoryId !== undefined ? Number(categoryId) : undefined,
    ...uploaded,
  } as productService.ProductInput);

  res.status(201).json({ product });
}

export async function updateProductHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const id = parseId(req.params.id);
  const { title, description, price, categoryId } = req.body;
  const uploaded = getUploadedFiles(req);

  const product = await productService.updateProduct(id, req.user.userId, req.user.roleName, {
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(price !== undefined ? { price: Number(price) } : {}),
    ...(categoryId !== undefined ? { categoryId: Number(categoryId) } : {}),
    ...uploaded,
  });

  res.status(200).json({ product });
}

export async function deleteProductHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const id = parseId(req.params.id);

  await productService.deleteProduct(id, req.user.userId, req.user.roleName);

  res.status(204).send();
}
