import { Request, Response } from "express";
import { ProductStatus } from "@prisma/client";
import * as productService from "../services/product.service";
import { AppError } from "../utils/AppError";
import { param } from "../utils/params";

function parseStatus(value: unknown): ProductStatus | undefined {
  if (typeof value === "string" && value in ProductStatus) {
    return value as ProductStatus;
  }
  return undefined;
}

export async function listProductsHandler(req: Request, res: Response): Promise<void> {
  const { categoryId, status, search, minPrice, maxPrice, page, pageSize } = req.query;

  const result = await productService.listProducts({
    categoryId: categoryId ? Number(categoryId) : undefined,
    status: parseStatus(status),
    search: typeof search === "string" ? search : undefined,
    minPrice: minPrice ? Number(minPrice) : undefined,
    maxPrice: maxPrice ? Number(maxPrice) : undefined,
    page: page ? Number(page) : undefined,
    pageSize: pageSize ? Number(pageSize) : undefined,
  });

  res.status(200).json(result);
}

export async function getProductHandler(req: Request, res: Response): Promise<void> {
  const product = await productService.getProductById(param(req.params.id));
  res.status(200).json(product);
}

export async function getProductBySlugHandler(req: Request, res: Response): Promise<void> {
  const product = await productService.getProductBySlug(param(req.params.slug));
  res.status(200).json(product);
}

export async function createProductHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const { categoryId, title, description, price, currency, coverImageUrl, status } = req.body;

  const product = await productService.createProduct(req.user.userId, {
    categoryId: Number(categoryId),
    title,
    description,
    price: Number(price),
    currency,
    coverImageUrl,
    status,
  });

  res.status(201).json(product);
}

export async function updateProductHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const { categoryId, title, description, price, currency, coverImageUrl, status } = req.body;

  const product = await productService.updateProduct(param(req.params.id), req.user.userId, req.user.roleName, {
    ...(categoryId !== undefined ? { categoryId: Number(categoryId) } : {}),
    ...(title !== undefined ? { title } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(price !== undefined ? { price: Number(price) } : {}),
    ...(currency !== undefined ? { currency } : {}),
    ...(coverImageUrl !== undefined ? { coverImageUrl } : {}),
    ...(status !== undefined ? { status } : {}),
  });

  res.status(200).json(product);
}

export async function deleteProductHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  await productService.deleteProduct(param(req.params.id), req.user.userId, req.user.roleName);

  res.status(204).send();
}
