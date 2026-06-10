import { Router } from 'express';
import { authenticate } from '../../common/middlewares/auth';
import { validate } from '../../common/middlewares/validate';
import { paymentsController } from './payments.controller';
import { createPreferenceSchema, webhookQuerySchema } from './payments.dto';

export const paymentsRouter = Router();

paymentsRouter.post(
  '/preferences',
  authenticate,
  validate({ body: createPreferenceSchema }),
  paymentsController.createPreference,
);

// Endpoint publico invocado por Mercado Pago (validado mediante x-signature)
paymentsRouter.post('/webhook', validate({ query: webhookQuerySchema }), paymentsController.webhook);
paymentsRouter.get('/webhook', validate({ query: webhookQuerySchema }), paymentsController.webhook);
