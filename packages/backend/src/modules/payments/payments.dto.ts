import { z } from 'zod';

export const createPreferenceSchema = z.object({
  orderId: z.string().uuid('Identificador de orden invalido'),
});
export type CreatePreferenceDto = z.infer<typeof createPreferenceSchema>;

// Mercado Pago envia las notificaciones IPN/Webhook como query params
// (formato nuevo: type=payment&data.id=123) o dentro del body (formato IPN).
export const webhookQuerySchema = z
  .object({
    type: z.string().optional(),
    topic: z.string().optional(),
    'data.id': z.string().optional(),
    id: z.string().optional(),
  })
  .passthrough();
export type WebhookQueryDto = z.infer<typeof webhookQuerySchema>;
