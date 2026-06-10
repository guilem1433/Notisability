import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().trim().min(2, 'El nombre debe tener al menos 2 caracteres').max(80),
  description: z.string().trim().max(500).optional(),
});
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;

export const categoryIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});
