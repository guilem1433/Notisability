import { OrderStatus } from '@prisma/client';
import { z } from 'zod';

export const createOrderSchema = z.object({
  promotionCode: z.string().trim().min(1).max(50).optional(),
});
export type CreateOrderDto = z.infer<typeof createOrderSchema>;

export const orderIdParamSchema = z.object({
  id: z.string().uuid('Identificador de orden invalido'),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
});
export type ListOrdersQueryDto = z.infer<typeof listOrdersQuerySchema>;
