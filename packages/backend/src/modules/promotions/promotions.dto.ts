import { DiscountType } from '@prisma/client';
import { z } from 'zod';

export const createPromotionSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    description: z.string().trim().max(500).optional(),
    discountType: z.nativeEnum(DiscountType),
    discountValue: z.coerce.number().positive('El valor del descuento debe ser mayor a 0'),
    code: z.string().trim().toUpperCase().min(3).max(50).optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'La fecha de fin debe ser posterior a la fecha de inicio',
    path: ['endDate'],
  })
  .refine((data) => data.discountType !== DiscountType.PERCENTAGE || data.discountValue <= 100, {
    message: 'Un descuento porcentual no puede ser mayor a 100',
    path: ['discountValue'],
  });
export type CreatePromotionDto = z.infer<typeof createPromotionSchema>;

export const updatePromotionSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(500).optional(),
  discountType: z.nativeEnum(DiscountType).optional(),
  discountValue: z.coerce.number().positive().optional(),
  code: z.string().trim().toUpperCase().min(3).max(50).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
});
export type UpdatePromotionDto = z.infer<typeof updatePromotionSchema>;

export const promotionIdParamSchema = z.object({
  id: z.string().uuid('Identificador de promocion invalido'),
});

export const assignProductsSchema = z.object({
  productIds: z.array(z.string().uuid()).min(1, 'Debe indicar al menos un producto'),
});
export type AssignProductsDto = z.infer<typeof assignProductsSchema>;

export const promotionProductParamSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid(),
});
