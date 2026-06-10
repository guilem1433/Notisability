import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'La calificacion minima es 1').max(5, 'La calificacion maxima es 5'),
  comment: z.string().trim().max(2000).optional(),
});
export type CreateReviewDto = z.infer<typeof createReviewSchema>;

export const updateReviewSchema = createReviewSchema.partial();
export type UpdateReviewDto = z.infer<typeof updateReviewSchema>;

export const reviewProductIdParamSchema = z.object({
  productId: z.string().uuid('Identificador de producto invalido'),
});

export const reviewIdParamSchema = z.object({
  id: z.string().uuid('Identificador de reseña invalido'),
});

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListReviewsQueryDto = z.infer<typeof listReviewsQuerySchema>;
