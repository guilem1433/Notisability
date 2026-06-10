import { ProductStatus } from '@prisma/client';
import { z } from 'zod';

export const createProductSchema = z.object({
  title: z.string().trim().min(3, 'El titulo debe tener al menos 3 caracteres').max(150),
  description: z.string().trim().min(10, 'La descripcion debe tener al menos 10 caracteres').max(5000),
  price: z.coerce.number().positive('El precio debe ser mayor a 0'),
  currency: z.string().trim().length(3).toUpperCase().default('COP'),
  categoryId: z.coerce.number().int().positive(),
  coverImageUrl: z.string().trim().url().optional(),
});
export type CreateProductDto = z.infer<typeof createProductSchema>;

export const updateProductSchema = z.object({
  title: z.string().trim().min(3).max(150).optional(),
  description: z.string().trim().min(10).max(5000).optional(),
  price: z.coerce.number().positive().optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  coverImageUrl: z.string().trim().url().optional(),
});
export type UpdateProductDto = z.infer<typeof updateProductSchema>;

export const updateProductStatusSchema = z.object({
  status: z.nativeEnum(ProductStatus),
});
export type UpdateProductStatusDto = z.infer<typeof updateProductStatusSchema>;

export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  providerId: z.string().uuid().optional(),
  status: z.nativeEnum(ProductStatus).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'rating']).default('newest'),
});
export type ListProductsQueryDto = z.infer<typeof listProductsQuerySchema>;

export const productIdParamSchema = z.object({
  id: z.string().uuid('Identificador de producto invalido'),
});

export const createProductFileSchema = z.object({
  version: z.string().trim().min(1, 'La version es requerida').max(30),
  changelog: z.string().trim().max(2000).optional(),
});
export type CreateProductFileDto = z.infer<typeof createProductFileSchema>;

export const productFileParamSchema = z.object({
  id: z.string().uuid(),
  fileId: z.string().uuid(),
});
