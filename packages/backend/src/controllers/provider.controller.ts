import { Request, Response } from "express";
import * as providerService from "../services/provider.service";
import * as productService from "../services/product.service";
import { AppError } from "../utils/AppError";
import { param } from "../utils/params";

export async function listMyProductsHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const products = await providerService.listMyProducts(req.user.userId);

  res.status(200).json(products);
}

export async function getMyProductHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const product = await providerService.getMyProductById(req.user.userId, param(req.params.id));

  res.status(200).json(product);
}

export async function createMyProductHandler(req: Request, res: Response): Promise<void> {
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

export async function updateMyProductHandler(req: Request, res: Response): Promise<void> {
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

export async function uploadProductFileHandler(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("No autenticado", 401);
  }

  const file = req.file;

  if (!file) {
    throw new AppError("Debes adjuntar un archivo", 400);
  }

  const { version, changelog } = req.body;

  const productFile = await providerService.uploadProductFile(
    req.user.userId,
    param(req.params.productId),
    file,
    version,
    changelog
  );

  res.status(201).json(productFile);
}
