import { z } from 'zod';

export const addCartItemSchema = z.object({
  productId: z.string().uuid('Identificador de producto invalido'),
});
export type AddCartItemDto = z.infer<typeof addCartItemSchema>;

export const cartItemParamSchema = z.object({
  productId: z.string().uuid('Identificador de producto invalido'),
});
