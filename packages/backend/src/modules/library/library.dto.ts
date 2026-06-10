import { z } from 'zod';

export const listLibraryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListLibraryQueryDto = z.infer<typeof listLibraryQuerySchema>;

export const libraryProductIdParamSchema = z.object({
  productId: z.string().uuid('Identificador de producto invalido'),
});
